import mysql from "mysql2";
import jwt from "jsonwebtoken";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "./passport-setup.js";
import googleRouter from "./googleLoginEndpoint.js";
import userRouter from "./users.js";
// index.js

import session from "express-session";
const RedisStore = require("connect-redis")(session);
const redis = require("redis").createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});
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
const sessionStore = new RedisStore({ client: redis });

app.use(
  session({
    store: sessionStore,
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
