const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { currencies } = require('../public/js/serverUtils.js');

const passUserToView = require("../middleware/pass-user-to-view");

const User = require('../models/user.js');

router.use(passUserToView);

router.get("/sign-in", (req, res) => {
  // If user is already signed in, redirect to home
  const path = req.path
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("auth/sign-in.ejs", { path, showMessage: false });
});

router.post('/sign-in', async (req, res, next) => {
  try {
    // checks for user and if none renders message
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
      return res.render('auth/sign-in.ejs', { path: req.path, showMessage: true });
    }

    // checks password using bcrypt compare and if invalid renders message
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );
    if (!validPassword) {
      return res.render('auth/sign-in.ejs', { path: req.path, showMessage: true });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.log("Session regeneration error:", err);
        // const reason = "Authentication error"
        // res.status(500).render('status.ejs', { reason })
        return res.status(500).send("Authentication error");
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
          // const reason = "Authentication error"
          // res.status(500).render('status.ejs', { err })
          return res.status(500).send("Authentication error");
        }
        res.redirect("/");
      });
    })

  } catch (e) {
    console.log("Cannot sign in", e);
    res.status(500).send("Cannot sign user in");
  }
});

router.get('/sign-up', (req, res) => {
  console.log('getting signup')
  const path = req.path
  res.render('auth/sign-up.ejs', { currencies, path, failedUser: false, failedPassword: false });
});

router.post('/sign-up', async (req, res, next) => {
  try {
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.render('auth/sign-up.ejs', { currencies, path: req.path, failedUser: true, failedPassword: false });
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.render('auth/sign-up.ejs', { currencies, path: req.path, failedPassword: true, failedUser: false });
    }
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;

    const currency = JSON.parse(req.body.currency)
    req.body.currency = currency

    await User.create(req.body);

    res.redirect("/auth/sign-in?newUser=true");
  } catch (e) {
    console.log("Cannot sign up", e);
    const err = {
      statusCode: 500,
      reason: "Cannot sign user up"
    }
    return next(err)
  }
});

router.get("/sign-out", (req, res) => {
  // Destroy session and clear cookie
  req.session.destroy((err) => {
    if (err) {
      console.log("Session destruction error:", err);
    }
    res.clearCookie("budgeo.sid"); // Clear the session cookie
    res.redirect("/");
  });
});

module.exports = router;
