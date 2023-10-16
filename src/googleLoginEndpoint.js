import app from "./index.js";
import passport from "passport";
import { Router } from "express";
import jwt from "jsonwebtoken";

const googleRouter = new Router();

googleRouter.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log("Error: Failed to destroy the session during logout.", err);
    }
    res.redirect(
      "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://https://expressquizzbackend-production.up.railway.app"
    );
  });
});
googleRouter.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["https://www.googleapis.com/auth/plus.login", "email"],
  })
);
googleRouter.get(
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

googleRouter.get("/some-route", (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  res.send(`Hello, ${req.user.displayName}`);
});
export default googleRouter;
