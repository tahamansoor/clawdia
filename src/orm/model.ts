import { Pool } from "pg";
import { MODEL_KEY } from "../constants";
import { getMetaData } from "../helpers";
import { AnyModelConstructor } from "./types/constructor.type";

/**
 * BaseModel - The foundation class for all ORM models in Clawdia
 *
 * Provides a complete set of database operations (CRUD) for PostgreSQL.
 * All model classes should extend this class to inherit database functionality.
 */
export abstract class BaseModel {
  static db: Pool;

  static useDB(pool: Pool) {
    this.db = pool;
  }

  static getTableName(): string {
    const config = getMetaData(this, MODEL_KEY);
    return config?.name ?? this.name.toLowerCase() + "s";
  }

  /**
   * Retrieves all records from the model's table
   */
  static async findAll<T>(this: AnyModelConstructor<T>): Promise<T[]> {
    const table = this.getTableName();
    const result = await this.db.query(`SELECT * FROM "${table}"`);
    return result.rows as T[];
  }

  /**
   * Finds a single record matching the given criteria
   */
  static async findOne<T>(
    this: AnyModelConstructor<T>,
    where: Partial<T>,
  ): Promise<T | null> {
    const table = this.getTableName();
    const keys = Object.keys(where);
    const values = Object.values(where);
    const whereClause = keys
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const result = await this.db.query(
      `SELECT * FROM "${table}" WHERE ${whereClause} LIMIT 1`,
      values,
    );
    return result.rows[0] ?? null;
  }

  /**
   * Creates a new record in the database
   */
  static async create<T>(
    this: AnyModelConstructor<T>,
    data: Partial<T>,
  ): Promise<T> {
    const table = this.getTableName();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const query = `
      INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const result = await this.db
      .query(query, values)
      .catch((error) => console.log(error, "fk"));
    return result!.rows[0] as T;
  }

  /**
   * Updates an existing record by ID
   */
  static async update<T extends Record<string, any>>(
    id: string,
    changes: Partial<T>,
  ): Promise<T> {
    const table = this.getTableName();
    const keys = Object.keys(changes);
    const values = Object.values(changes);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const query = `
        UPDATE "${table}"
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *;
      `;

    const result = await this.db.query(query, [...values, id]);
    return result.rows[0];
  }

  /**
   * Deletes a record by ID
   */
  static async delete<T>(where: Partial<T>): Promise<boolean> {
    const table = this.getTableName();
    const keys = Object.keys(where);
    const values = Object.values(where);
    const whereClause = keys
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const query = `
      DELETE FROM "${table}" WHERE ${whereClause}
    `;

    const result = await this.db.query(query, values);
    return (result.rowCount ?? 0) > 0;
  }
}
