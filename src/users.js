import app from "./index.js";
import { Router } from "express";
import pool from "./database.js";

const userRouter = new Router();

userRouter.get("/users", (req, res) => {
  const query = "SELECT * FROM users";
  pool.query(query, (error, results) => {
    if (error) {
      console.error("Database error:", error.stack);
      res.status(500).send("Database error.");
      return;
    }
    res.json(results);
  });
});

export default userRouter;
