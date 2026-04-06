import express from "express";

import {
  createUser,
  getAllUsers,
  getUserLogs,
} from "../service/user-service.js";
import { createExercise } from "../service/exercise-service.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded());

router.post("/", async (req, res) => {
  const { username } = req.body;
  try {
    return res.json(await createUser(username));
  } catch (error) {
    return res.status(error.statusCode).send(error.message);
  }
});

router.get("/", async (req, res) => {
  try {
    return res.json(await getAllUsers());
  } catch (error) {
    return res.status(error.statusCode).send(error.message);
  }
});

router.post("/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    return res.json(await createExercise(_id, description, duration, date));
  } catch (error) {
    return res.status(error.statusCode).send(error.message);
  }
});

router.get("/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    return res.json(await getUserLogs(_id, from, to, limit));
  } catch (error) {
    return res.status(error.statusCode).send(error.message);
  }
});

export default router;
