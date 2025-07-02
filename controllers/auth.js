const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { currencies } = require('../public/js/serverUtils.js');

const passUserToView = require("../middleware/pass-user-to-view");

const User = require('../models/user.js');

router.use(passUserToView);

router.get('/sign-up', (req, res) => {
  const path = req.path
  res.render('auth/sign-up.ejs', { currencies, path });
});

router.get("/sign-in", (req, res) => {
  // If user is already signed in, redirect to home
  const path = req.path
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("auth/sign-in.ejs", { path });
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

router.post('/sign-up', async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.send('Username already taken.');
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.send('Password and Confirm Password must match');
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;

    const currency = JSON.parse(req.body.currency)
    req.body.currency = currency

    await User.create(req.body);

    res.redirect("/auth/sign-in?newUser=true");
  } catch (e) {
    console.log("Cannot sign up", e);
    res.status(500).send("Cannot sign user up");
  }
});

router.post('/sign-in', async (req, res) => {
  try {
    // First, get the user from the database
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
      return res.send('Login failed. Please try again.');
    }

    // There is a user! Time to test their password with bcrypt
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );

    if (!validPassword) {
      return res.send('Login failed. Please try again.');
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.log("Session regeneration error:", err);
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

module.exports = router;
