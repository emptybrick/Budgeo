// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { currencies } = require("../public/js/serverUtils.js");
const User = require("../models/user.js");
const _ = require("lodash");
const passport = require("passport");          // <-- add this

/* -------------------------------------------------
   GET /budgeo/auth/sign-in
   ------------------------------------------------- */
router.get("/sign-in", (req, res) => {
  if (req.user) return res.redirect(`/budgeo/${ req.user.username }/expenses`);

  res.render("auth/sign-in.ejs", {
    path: req.path,
    showMessage: false,
    newUser: req.query.newUser || false,
    signedOut: req.query.signedOut || false,
    user: null,
  });
});

/* -------------------------------------------------
   POST /budgeo/auth/sign-in  (Passport local)
   ------------------------------------------------- */
router.post(
  "/sign-in",
  passport.authenticate("local", {
    failureRedirect: "/budgeo/auth/sign-in",
    failureFlash: true,
  }),
  (req, res) => {
    // success → go straight to the user’s dashboard
    res.redirect(`/budgeo/${ req.user.username }/expenses`);
  }
);

/* -------------------------------------------------
   GET /budgeo/auth/sign-up
   ------------------------------------------------- */
router.get("/sign-up", (req, res) => {
  res.render("auth/sign-up.ejs", {
    currencies,
    path: req.path,
    failedUser: false,
    failedPassword: false,
    failedCurrency: false,
    failedSpecialChar: false,
    user: null,
  });
});

/* -------------------------------------------------
   POST /budgeo/auth/sign-up
   ------------------------------------------------- */
router.post("/sign-up", async (req, res, next) => {
  try {
    // ---- 1. username validation ---------------------------------
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(req.body.username)) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedSpecialChar: true,
        failedUser: false,
        failedPassword: false,
        failedCurrency: false,
        user: null,
      });
    }

    // ---- 2. password match ---------------------------------------
    if (req.body.password !== req.body.confirmPassword) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedPassword: true,
        failedUser: false,
        failedCurrency: false,
        failedSpecialChar: false,
        user: null,
      });
    }

    // ---- 3. unique username --------------------------------------
    const existing = await User.findOne({ username: req.body.username });
    if (existing) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedUser: true,
        failedPassword: false,
        failedCurrency: false,
        failedSpecialChar: false,
        user: null,
      });
    }

    // ---- 4. currency validation ----------------------------------
    const parsedCurrency = JSON.parse(req.body.currency);
    const currencyMatch = currencies.find((c) => c.code === parsedCurrency.code);
    if (!currencyMatch || !_.isEqual(currencyMatch, parsedCurrency)) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedCurrency: true,
        failedUser: false,
        failedPassword: false,
        failedSpecialChar: false,
        user: null,
      });
    }

    // ---- 5. create user -------------------------------------------
    const hashed = bcrypt.hashSync(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashed,
      currency: parsedCurrency,
    });
    await newUser.save();

    // ---- 6. **AUTO-LOGIN** with Passport -------------------------
    req.login(newUser, (err) => {
      if (err) return next(err);
      return res.redirect(`/budgeo/${ newUser.username }/expenses`);
    });
  } catch (e) {
    console.error("Sign-up error:", e);
    next({ statusCode: 500, reason: "CANNOT SIGN USER UP" });
  }
});

/* -------------------------------------------------
   GET /budgeo/auth/sign-out
   ------------------------------------------------- */
router.get("/sign-out", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("budgeo.sid");
      res.redirect("/budgeo/auth/sign-in?signedOut=true");
    });
  });
});

module.exports = router;