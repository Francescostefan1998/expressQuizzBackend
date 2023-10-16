import mysql from "mysql2";
import jwt from "jsonwebtoken";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "./passport-setup.js";
import googleRouter from "./googleLoginEndpoint.js";
import userRouter from "./users.js";
dotenv.config();

const app = express();

// Use the `cors` package
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "some_random_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/", googleRouter);
app.use("/users", userRouter);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
