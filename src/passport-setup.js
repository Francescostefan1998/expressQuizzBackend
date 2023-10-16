import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./database.js";

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
    (token, profile, done) => {
      // Removed tokenSecret
      const {
        given_name: name,
        family_name: surname,
        email,
        locale,
      } = profile._json;

      pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (error, results) => {
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

export default passport;
