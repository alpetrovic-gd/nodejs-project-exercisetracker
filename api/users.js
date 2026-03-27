import express from "express";
import { getDb } from "../db/db.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded());

router.post("/", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send("Username is missing, but is required");
  } else if (username.trim().length === 0) {
    return res.status(422).send("Username cannot empty");
  }

  try {
    const db = getDb();

    const result = await db.run("INSERT INTO users (username) VALUES (?)", [
      username,
    ]);

    return res.json({
      _id: result.lastID,
      username: username,
    });
  } catch (error) {
    if (
      error.code === "SQLITE_CONSTRAINT" &&
      error.message.includes("UNIQUE")
    ) {
      return res.status(422).send("Username already exists");
    }
    return res.status(500).send("Database error. " + error.message);
  }
});

router.get("/", async (req, res) => {
  try {
    const db = getDb();

    const result = await db.all("SELECT * FROM users");

    return res.json(result);
  } catch (error) {
    return res.status(500).send("Database error. " + error.message);
  }
});

router.post("/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;

  if (!description) {
    return res.status(400).send("Description is missing, but is required");
  }

  if (!duration) {
    return res.status(400).send("Duration is missing, but is required");
  }

  const dateObj = date ? new Date(date) : new Date();
  const dateString = dateObj.toDateString();

  try {
    const db = getDb();

    const user = await db.get("SELECT username FROM users WHERE _id = ?", [
      _id,
    ]);

    if (!user) {
      return res.status(404).send("User with the given ID not found");
    }

    await db.run(
      `INSERT INTO exercises (user_id, description, duration, date) 
             VALUES (?, ?, ?, ?)`,
      [_id, description, parseInt(duration), dateString],
    );

    return res.json({
      username: user.username,
      description: description,
      duration: parseInt(duration),
      date: dateString,
      _id: _id,
    });
  } catch (error) {
    return res.status(500).send("Database error. " + error.message);
  }
});

router.get("/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const db = getDb();

    const user = await db.get(`SELECT username FROM users WHERE _id=?`, [_id]);

    if (!user) {
      return res.status(404).send("User not found");
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

    return res.json({
      username: user.username,
      count: exercises.length,
      _id,
      log: exercises,
    });
  } catch (error) {
    return res.status(500).send("Database error. " + error.message);
  }
});

export default router;
