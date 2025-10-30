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

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");

// Serialize
passport.serializeUser((user, done) => done(null, user._id));

// Deserialize
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Local strategy (username field = email? adjust if you use username)
passport.use(
  new LocalStrategy(
    { usernameField: "username" }, // <-- change to "email" if you login with email
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) return done(null, false);
        const ok = bcrypt.compareSync(password, user.password);
        return ok ? done(null, user) : done(null, false);
      } catch (err) {
        return done(err);
      }
    }
  )
);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB budgeo.');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    // DO NOT CRASH — keep app running
    console.log('App will run in offline mode (no DB)');
  });

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

app.use(passport.initialize());
app.use(passport.session());

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
