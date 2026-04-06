import express from "express";
import { getDb } from "../db/db.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded());

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isDateInValidFormat(date) {
  return dateRegex.test(date) && !isNaN(new Date(date).getTime());
}

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
      username.trim(),
    ]);

    return res.json({
      _id: result.lastID,
      username: username.trim(),
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
  if (description.trim().length === 0) {
    return res.status(422).send("Description cannot be empty");
  }

  if (!duration) {
    return res.status(400).send("Duration is missing, but is required");
  }
  if (isNaN(parseInt(duration)) || duration <= 0) {
    return res.status(422).send("Duration must be a number greater than 0");
  }

  if (date) {
    date = date.trim();
    if (!isDateInValidFormat(date)) {
      return res
        .status(400)
        .send("Invalid 'date' date format. Expected YYYY-MM-DD");
    }
  }

  const dateObj = date ? new Date(date) : new Date();
  const dateString = dateObj.toISOString().split("T")[0];

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
      [_id, description.trim(), parseInt(duration), dateString],
    );

    return res.json({
      username: user.username,
      description: description.trim(),
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
  let { from, to, limit } = req.query;

  if (from) {
    from = from.trim();
    if (!isDateInValidFormat(from)) {
      return res
        .status(400)
        .send("Invalid 'from' date format. Expected YYYY-MM-DD");
    }
  }

  if (to) {
    to = to.trim();
    if (!isDateInValidFormat(to)) {
      return res
        .status(400)
        .send("Invalid 'to' date format. Expected YYYY-MM-DD");
    }
  }

  if (limit) {
    limit = limit.trim();
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      return res
        .status(400)
        .send("Limit must be a number greater than or equal to 0");
    }
  }

  try {
    const db = getDb();

    const user = await db.get(`SELECT username FROM users WHERE _id=?`, [_id]);

    if (!user) {
      return res.status(404).send("User not found");
    }

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

    let exercises = await db.all(query, params);

    return res.json({
      username: user.username,
      count: countResult.total,
      _id,
      log: exercises,
    });
  } catch (error) {
    return res.status(500).send("Database error. " + error.message);
  }
});

export default router;
