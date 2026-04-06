import { getDb } from "../db/db.js";
import { SqlError } from "../error/sql-error.js";

export async function create(username) {
  try {
    const db = getDb();

    const result = await db.run("INSERT INTO users (username) VALUES (?)", [
      username.trim(),
    ]);

    return {
      _id: result.lastID,
      username: username.trim(),
    };
  } catch (error) {
    throw new SqlError(error.message, error.code);
  }
}

export async function getAll() {
  try {
    const db = getDb();

    return await db.all("SELECT * FROM users");
  } catch (error) {
    throw new SqlError(error.message, error.code);
  }
}

export async function get(_id) {
  try {
    const db = getDb();

    return await db.get("SELECT username FROM users WHERE _id = ?", [_id]);
  } catch (error) {
    throw new SqlError(error.message, error.code);
  }
}

export async function getLogs(_id, from, to, limit) {
  try {
    const db = getDb();

    let countQuery = `SELECT COUNT(*) as total FROM exercises WHERE user_id=?`;
    let query = `SELECT description, duration, date FROM exercises WHERE user_id=?`;
    let params = [_id];

    if (from) {
      countQuery += ` AND date >= ?`;
      query += ` AND date >= ?`;
      params.push(from);
    }

    if (to) {
      countQuery += ` AND date <= ?`;
      query += ` AND date <= ?`;
      params.push(to);
    }

    const countResult = await db.get(countQuery, params);

    query += ` ORDER BY date`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const exercises = await db.all(query, params);

    return {
      count: countResult.total,
      exercises,
    };
  } catch (error) {
    throw new SqlError(error.message, error.code);
  }
}
