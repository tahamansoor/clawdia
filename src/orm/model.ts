import { Pool } from "pg";
import { MODEL_KEY } from "../constants";
import { getMetaData } from "../helpers";

export abstract class BaseModel {
  static db: Pool;

  static useDB(pool: Pool) {
    this.db = pool;
  }

  static getTableName(): string {
    const config = getMetaData(this, MODEL_KEY);
    return config?.name ?? this.name.toLowerCase() + "s";
  }

  static async findAll<T>(
    this: { new (): T } & typeof BaseModel,
  ): Promise<T[]> {
    const table = this.getTableName();
    const result = await this.db.query(`SELECT * FROM ${table}`);
    return result.rows as T[];
  }

  static async findOne<T>(
    this: { new (): T } & typeof BaseModel,
    where: Partial<T>,
  ): Promise<T | null> {
    const table = this.getTableName();
    const keys = Object.keys(where);
    const values = Object.values(where);
    const whereClause = keys
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const result = await this.db.query(
      `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
      values,
    );
    return result.rows[0] ?? null;
  }

  static async create<T>(
    this: { new (): T } & typeof BaseModel,
    data: Partial<T>,
  ): Promise<T> {
    const table = this.getTableName();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const query = `
      INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;
    const result = await this.db.query(query, values);
    return result.rows[0] as T;
  }

  static async update<T extends Record<string, any>>(
    id: string,
    changes: Partial<T>,
  ): Promise<T> {
    const table = this.getTableName();
    const keys = Object.keys(changes);
    const values = Object.values(changes);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const query = `
        UPDATE ${table}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *;
      `;

    const result = await this.db.query(query, [...values, id]);
    return result.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM ${this.getTableName()} WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
