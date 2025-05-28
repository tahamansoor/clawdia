import { Pool } from "pg";
import { MODEL_KEY } from "../constants";
import { getMetaData } from "../helpers";

/**
 * BaseModel - The foundation class for all ORM models in Clawdia
 * 
 * Provides a complete set of database operations (CRUD) for PostgreSQL.
 * All model classes should extend this class to inherit database functionality.
 * 
 * Features:
 * - Automatic table name resolution (from @Model decorator or class name)
 * - Type-safe CRUD operations
 * - PostgreSQL connection management
 * - Error handling
 * 
 * @example
 * ```typescript
 * // Define a model
 * @Model("users")
 * class User extends BaseModel {
 *   id!: string;
 *   username!: string;
 *   email!: string;
 * }
 * 
 * // Use the model
 * const users = await User.findAll();
 * const user = await User.findOne({ id: "123" });
 * const newUser = await User.create({ username: "john", email: "john@example.com" });
 * ```
 */
export abstract class BaseModel {
  /**
   * Shared database connection pool used by all model classes
   * @static
   */
  static db: Pool;

  /**
   * Sets the database connection pool for all model operations
   * 
   * This method is called by the Clawdia framework during initialization
   * to establish database connectivity for all models.
   * 
   * @param {Pool} pool - PostgreSQL connection pool
   * @static
   */
  static useDB(pool: Pool) {
    this.db = pool;
  }

  /**
   * Resolves the database table name for the model
   * 
   * Gets the table name from the @Model decorator metadata or falls back to the
   * lowercase class name with an "s" suffix (pluralization).
   * 
   * @returns {string} The resolved table name
   * @static
   * 
   * @example
   * ```typescript
   * // Table name from decorator
   * @Model("custom_users")
   * class User extends BaseModel { ... }
   * // User.getTableName() returns "custom_users"
   * 
   * // Default table name
   * class Product extends BaseModel { ... }
   * // Product.getTableName() returns "products"
   * ```
   */
  static getTableName(): string {
    const config = getMetaData(this, MODEL_KEY);
    return config?.name ?? this.name.toLowerCase() + "s";
  }

  /**
   * Retrieves all records from the model's table
   * 
   * @template T - The type of model instances to return
   * @param {this} this - The model class with constructor
   * @returns {Promise<T[]>} Array of model instances
   * @throws {Error} If database query fails
   * @static
   * 
   * @example
   * ```typescript
   * // Get all users
   * const users = await User.findAll();
   * users.forEach(user => console.log(user.username));
   * ```
   */
  static async findAll<T>(
    this: { new (): T } & typeof BaseModel,
  ): Promise<T[]> {
    const table = this.getTableName();
    const result = await this.db.query(`SELECT * FROM ${table}`);
    return result.rows as T[];
  }

  /**
   * Finds a single record matching the given criteria
   * 
   * @template T - The type of model instance to return
   * @param {this} this - The model class with constructor
   * @param {Partial<T>} where - Object containing field-value pairs to match against
   * @returns {Promise<T | null>} The matching record or null if not found
   * @throws {Error} If database query fails
   * @static
   * 
   * @example
   * ```typescript
   * // Find by ID
   * const user = await User.findOne({ id: "user_123" });
   * 
   * // Find by other criteria
   * const admin = await User.findOne({ role: "admin", active: true });
   * 
   * if (user) {
   *   console.log(`Found user: ${user.username}`);
   * }
   * ```
   */
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
      `SELECT * FROM "${table}" WHERE ${whereClause} LIMIT 1`,
      values,
    );
    return result.rows[0] ?? null;
  }

  /**
   * Creates a new record in the database
   * 
   * @template T - The type of model instance to return
   * @param {this} this - The model class with constructor
   * @param {Partial<T>} data - Object containing field-value pairs to insert
   * @returns {Promise<T>} The newly created record with all fields
   * @throws {Error} If insertion fails (e.g., constraint violations)
   * @static
   * 
   * @example
   * ```typescript
   * // Create a new user
   * const newUser = await User.create({
   *   username: "john_doe",
   *   email: "john@example.com",
   *   active: true
   * });
   * 
   * console.log(`Created user with ID: ${newUser.id}`);
   * ```
   */
  static async create<T>(
    this: { new (): T } & typeof BaseModel,
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
   * 
   * @template T - The type with string-indexed fields
   * @param {string} id - The unique identifier for the record to update
   * @param {Partial<T>} changes - Object containing field-value pairs to update
   * @returns {Promise<T>} The updated record with all fields
   * @throws {Error} If update fails or record doesn't exist
   * @static
   * 
   * @example
   * ```typescript
   * // Update a user
   * const updatedUser = await User.update("user_123", {
   *   username: "new_username",
   *   active: false
   * });
   * 
   * console.log(`Updated user: ${updatedUser.username}`);
   * ```
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
   * 
   * @param {string} id - The unique identifier for the record to delete
   * @returns {Promise<boolean>} True if a record was deleted, false otherwise
   * @throws {Error} If deletion fails
   * @static
   * 
   * @example
   * ```typescript
   * // Delete a user
   * const success = await User.delete("user_123");
   * 
   * if (success) {
   *   console.log("User successfully deleted");
   * } else {
   *   console.log("User not found or couldn't be deleted");
   * }
   * ```
   */
  static async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM" ${this.getTableName()}" WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
