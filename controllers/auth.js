const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { currencies } = require("../public/js/serverUtils.js");
const User = require("../models/user.js");

router.get("/sign-in", (req, res) => {
  // If user is already signed in, redirect to home
  try {
    const path = req.path;
    if (req.session.user) {
      return res.redirect(`/budgeo/${req.session.user.username}/expenses`);
    }
    res.render("auth/sign-in.ejs", { path, showMessage: false });
  } catch (e) {
    console.log(e);
    const err = {
      statusCode: 500,
      reason: "CANNOT LOCATE THE SIGN-IN PAGE!",
    };
    return next(err);
  }
});

router.post("/sign-in", async (req, res, next) => {
  try {
    // checks for user and if none renders message
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
      return res.render("auth/sign-in.ejs", {
        path: req.path,
        showMessage: true,
      });
    }

    // checks password using bcrypt compare and if invalid renders message
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );
    if (!validPassword) {
      return res.render("auth/sign-in.ejs", {
        path: req.path,
        showMessage: true,
      });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.log("Session regeneration error:", err);
        const err = {
          statusCode: 500,
          reason: "AUTHENTICATION ERROR",
        };
        return next(err);
      }

      // There is a user AND they had the correct password. Time to make a session!
      // Avoid storing the password, even in hashed format, in the session
      // If there is other data you want to save to `req.session.user`, do so here!
      req.session.user = {
        username: userInDatabase.username,
        _id: userInDatabase._id,
        loginTime: new Date().toISOString(),
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.log("Session save error:", err);
          const err = {
            statusCode: 500,
            reason: "AUTHENTICATION ERROR",
          };
          return next(err);
        }
        res.redirect(`/budgeo/${req.session.user.username}/expenses`);
      });
    });
  } catch (e) {
    console.log("Cannot sign in", e);
    const err = {
      statusCode: 500,
      reason: "CANNOT SIGN USER IN",
    };
    return next(err);
  }
});

router.get("/sign-up", (req, res) => {
  const path = req.path;
  res.render("auth/sign-up.ejs", {
    currencies,
    path,
    failedUser: false,
    failedPassword: false,
    failedCurrency: false,
    failedSpecialChar: false,
  });
});

router.post("/sign-up", async (req, res, next) => {
  try {
    // validate no special characters in username except _
    const regex = /^[\p{L}\p{N}_]*$/u;
    if (!regex.test(req.body.username)) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedUser: false,
        failedPassword: false,
        failedCurrency: false,
        failedSpecialChar: true,
      });
    }
    // validating password
    if (req.body.password !== req.body.confirmPassword) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedUser: false,
        failedPassword: true,
        failedCurrency: false,
        failedSpecialChar: false,
      });
    }

    // validating unique user
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedUser: true,
        failedPassword: false,
        failedCurrency: false,
        failedSpecialChar: false,
      });
    }

    // validating currency option selected matches valid options
    const currencySelected = currencies.find(
      (currency) => currency.code === req.body.currency.code
    );
    if (!req.body.currency || currencySelected) {
      return res.render("auth/sign-up.ejs", {
        currencies,
        path: req.path,
        failedPassword: false,
        failedUser: false,
        failedCurrency: true,
        failedSpecialChar: false,
      });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;

    const currency = JSON.parse(req.body.currency);
    req.body.currency = currency;

    await User.create(req.body);

    res.redirect("/auth/sign-in?newUser=true");
  } catch (e) {
    console.log("Cannot sign up", e);
    const err = {
      statusCode: 500,
      reason: "CANNOT SIGN USER UP",
    };
    return next(err);
  }
});

router.get("/sign-out", (req, res) => {
  // Destroy session and clear cookie
  req.session.destroy((err) => {
    if (err) {
      console.log("Session destruction error:", err);
    }
    res.clearCookie("budgeo.sid"); // Clear the session cookie
    res.redirect("/budgeo");
  });
});

module.exports = router;
