import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import api from "./api/api.js";
import { initDb } from "./db/db.js";

const app = express();

dotenv.config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(import.meta.dirname, "/views/index.html"));
});
app.use("/api", api);

await initDb();
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
