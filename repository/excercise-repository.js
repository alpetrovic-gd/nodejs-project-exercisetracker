import { getDb } from "../db/db.js";
import { SqlError } from "../error/sql-error.js";

export async function create(_id, description, duration, dateString) {
  try {
    const db = getDb();

    return await db.run(
      `INSERT INTO exercises (user_id, description, duration, date)
             VALUES (?, ?, ?, ?)`,
      [_id, description, duration, dateString],
    );
  } catch (error) {
    throw new SqlError(error.message, error.code);
  }
}
