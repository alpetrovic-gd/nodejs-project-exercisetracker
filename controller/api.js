import express from "express";
import users from "./user-controller.js";

const router = express.Router();

router.use("/users", users);

export default router;
