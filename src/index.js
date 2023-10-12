// 1. Import required modules and configurations
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

// 2. Initialize Express app
const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Consentire tutte le origini (assicurati di limitarlo per la produzione)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

// 3. Configure Passport
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
      // ... (keep your previous configurations)
    },
    async (token, tokenSecret, profile, done) => {
      console.log(profile);

      // Extract necessary data
      const {
        given_name: name,
        family_name: surname,
        email,
        locale,
      } = profile._json;

      // Check if user exists in the database
      connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (error, results) => {
          if (error) {
            return done(error);
          }

          let user = results[0];

          if (!user) {
            // If user doesn't exist, create the user in the database
            const insertQuery = `
            INSERT INTO users (name, surname, email, nationality) 
            VALUES (?, ?, ?, ?)`; // Defaulting nationality to 'Unknown' for now

            connection.query(
              insertQuery,
              [name, surname, email, toUpperCase(locale)],
              (error, results) => {
                if (error) {
                  return done(error);
                }

                user = { id: results.insertId, name, surname, email }; // New user object
                return done(null, user);
              }
            );
          } else {
            // If user already exists
            return done(null, user);
          }
        }
      );
    }
  )
);

// 4. Setup session and Passport middlewares
app.use(
  session({
    secret: "some_random_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 5. Establish the database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
    return;
  }
  console.log("Connected to the database.");
});

// 6. Define routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/users", (req, res) => {
  const query = "SELECT * FROM users";
  connection.query(query, (error, results) => {
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

      // Create JWT
      const secretKey = "unaStringaMoltoMoltoLungaCheEquivaleAlmenoA256Bit";
      const token = jwt.sign({ sub: email }, secretKey);

      const response = JSON.stringify({
        user: {
          id,
          name,
          surname,
          email,
          locale,
          encryptedPassword: "...", // You might not want to send this!
        },
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
    return res.redirect("/auth/google"); // Not logged in
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

// 7. Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
