const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require("connect-mongo");

const authController = require('./controllers/auth.js');
const budgetController = require('./controllers/budget.js');

const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require('./middleware/pass-user-to-view.js');

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
      ttl: 24 * 60 * 60, // 1 day TTL
      autoRemove: "native", // Use MongoDB TTL index
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      sameSite: "lax", // CSRF protection
    },
    name: "budgeo.sid", // Custom session cookie name
  })
);

app.use('/auth', authController);

app.use(passUserToView);

app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect(`/users/${req.session.user._id}/budget`);
  } else {
    res.render('index.ejs', { req });
  }
});

app.use(isSignedIn);

app.use('/users/:userId/budget', budgetController);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
