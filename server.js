const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require("connect-mongo");

const authController = require('./controllers/auth.js');
const budgeoController = require('./controllers/budgeo.js');

const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require('./middleware/pass-user-to-view.js');
const { reasons404 } = require('./public/js/serverUtils.js');

const port = process.env.PORT ? process.env.PORT : '3000';

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(
  session({
    secret:
      process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Changed to false for security
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60, // 1 day TTL
      autoRemove: "native", // Use MongoDB TTL index
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true, // Prevent XSS attacks
      maxAge: 60 * 60 * 1000, // 1 day in milliseconds
      sameSite: "lax", // CSRF protection
    },
    name: "budgeo.sid", // Custom session cookie name
  })
);

app.use(passUserToView);

app.get("/", (req, res) => {
    res.redirect("/budgeo");
});

app.get("/budgeo", (req, res) => {
  const path = req.path;
  if (req.session.user) {
    res.redirect(`/budgeo/${req.session.user.username}/expenses`);
  } else {
    res.render("index.ejs", { path });
  }
});

app.use("/budgeo/auth", authController);

app.use(isSignedIn);

app.use("/budgeo", budgeoController);

// catch all for 404
app.use('/*splat', (req, res) => {
  const reason = reasons404[Math.floor(Math.random()*10)];
  const statusCode = 404 
  res.render('status.ejs', { reason, statusCode })
})

app.use((err, req, res, next) => {
  console.log(err)
  res.render('status.ejs', { statusCode: err.statusCode, reason: err.reason })
})

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
