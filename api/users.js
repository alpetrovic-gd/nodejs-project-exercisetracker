import express from "express";
import { getDb } from "../db/db.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded());

router.post("/", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).send("Username is missing, but is required");
  }

  try {
    const db = getDb();

    const result = await db.run("INSERT INTO users (username) VALUES (?)", [
      username,
    ]);

    res.json({
      _id: result.lastID,
      username: username,
    });
  } catch (error) {
    res.status(500).send("Database error.\n" + error.message);
    throw error;
  }
});

router.get("/", async (req, res) => {
  try {
    const db = getDb();

    const result = await db.all("SELECT * FROM users");

    res.json(result);
  } catch (error) {
    res.status(500).send("Database error.\n" + error.message);
    throw error;
  }
});

router.post("/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;

  const dateObj = date ? new Date(date) : new Date();
  const dateString = dateObj.toDateString();

  try {
    const db = getDb();

    const user = await db.get("SELECT username FROM users WHERE _id = ?", [
      _id,
    ]);

    if (!user) {
      res.status(404).send("User not found");
    }

    await db.run(
      `INSERT INTO exercises (user_id, description, duration, date) 
             VALUES (?, ?, ?, ?)`,
      [_id, description, parseInt(duration), dateString],
    );

    res.json({
      username: user.username,
      description: description,
      duration: parseInt(duration),
      date: dateString,
      _id: _id,
    });
  } catch (error) {
    res.status(500).send("Database error.\n" + error.message);
    throw error;
  }
});

router.get("/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const db = getDb();

    const user = await db.get(`SELECT username FROM users WHERE _id=?`, [_id]);

    if (!user) {
      res.status(404).send("User not found");
    }

    let exercises = await db.all(
      `SELECT description, duration, date FROM exercises WHERE user_id=?`,
      [_id],
    );

    if (from) {
      exercises = exercises.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        const fromDate = new Date(from);
        return exerciseDate >= fromDate;
      });
    }

    if (to) {
      exercises = exercises.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        const toDate = new Date(to);
        return exerciseDate <= toDate;
      });
    }

    if (limit) {
      exercises = exercises.slice(0, parseInt(limit));
    }

    res.json({
      username: user.username,
      count: exercises.length,
      _id,
      log: exercises,
    });
  } catch (error) {
    res.status(500).send("Database error.\n" + error.message);
    throw error;
  }
});

export default router;
