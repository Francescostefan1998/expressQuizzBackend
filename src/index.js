import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mysql from "mysql2";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

// Use the `cors` package
app.use(
  cors({
    origin: "*", // Adjust as needed
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (token, tokenSecret, profile, done) => {
      const {
        given_name: name,
        family_name: surname,
        email,
        locale,
      } = profile._json;

      pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (error, results) => {
          if (error) {
            return done(error);
          }

          let user = results[0];

          if (!user) {
            const insertQuery = `
              INSERT INTO users (name, surname, email, nationality) 
              VALUES (?, ?, ?, ?)`;

            pool.query(
              insertQuery,
              [name, surname, email, locale.toUpperCase()],
              (error, results) => {
                if (error) {
                  return done(error);
                }
                user = { id: results.insertId, name, surname, email, locale };
                return done(null, user);
              }
            );
          } else {
            return done(null, user);
          }
        }
      );
    }
  )
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "some_random_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/users", (req, res) => {
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

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["https://www.googleapis.com/auth/plus.login", "email"],
  })
);

app.get(
  "/login/oauth2/code/google",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    if (req.user) {
      const { id, name, surname, email, locale } = req.user;

      const secretKey =
        process.env.JWT_SECRET ||
        "unaStringaMoltoMoltoLungaCheEquivaleAlmenoA256Bit";
      const token = jwt.sign({ sub: email }, secretKey);

      const response = JSON.stringify({
        user: { id, name, surname, email, locale },
        token,
      });
      const frontendURL = "https://frontend-would-you-rather.vercel.app";
      res.redirect(`${frontendURL}/google-auth-redirect?data=${response}`);
    } else {
      res.status(500).send("Authentication failed.");
    }
  }
);

app.get("/some-route", (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  res.send(`Hello, ${req.user.displayName}`);
});

app.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log("Error: Failed to destroy the session during logout.", err);
    }
    res.redirect(
      "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://https://expressquizzbackend-production.up.railway.app"
    );
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
