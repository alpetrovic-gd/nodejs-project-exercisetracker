import { Database } from "sqlite-async";

let db;

export const initDb = async () => {
  try {
    db = await Database.open("./db/database.db");

    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
          _id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS exercises (
          _id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          duration INTEGER NOT NULL,
          date TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(_id)
      )
    `);
    console.log("SQLite Connected!");
    return db;
  } catch (error) {
    console.error("Failed to connect to SQLite:", error);
    throw error;
  }
};

export const getDb = () => db;
