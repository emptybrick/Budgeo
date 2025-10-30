// server.js
require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const User = require("./models/user");
const authController = require("./controllers/auth.js");
const budgeoController = require("./controllers/budgeo.js");

const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");
const { reasons404 } = require("./public/js/serverUtils.js");

const port = process.env.PORT || 3000;

// ----------------------- PASSPORT -----------------------
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
passport.use(new LocalStrategy(
  { usernameField: "username" },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false);
      const valid = await bcrypt.compare(password, user.password);
      return valid ? done(null, user) : done(null, false);
    } catch (err) {
      return done(err);
    }
  }
));

// ----------------------- MONGOOSE -----------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB budgeo."))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    console.log("App running in offline mode (no DB)");
  });

mongoose.connection.on("connected", () => {
  console.log(`MongoDB connected: ${ mongoose.connection.name }`);
});

// ----------------------- MIDDLEWARE -----------------------
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: 24 * 60 * 60,
    autoRemove: "native",
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
  name: "budgeo.sid",
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(passUserToView);

// ----------------------- ROUTES -----------------------
app.get("/", (req, res) => res.redirect("/budgeo"));

app.get("/budgeo", (req, res) => {
  if (req.user) {
    return res.redirect(`/budgeo/${ req.user.username }/expenses`);
  }
  res.render("index.ejs", { path: req.path });
});

app.use("/budgeo/auth", authController);
app.use(isSignedIn); // ← PROTECT ALL BELOW

// BUDGEO ROUTES (CRUD, dashboard, data, etc.)
app.use("/budgeo", budgeoController);

// 404
app.use((req, res) => {
  const reason = reasons404[ Math.floor(Math.random() * reasons404.length) ];
  res.status(404).render("status", { statusCode: 404, reason });
});

// ERROR
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const reason = err.reason || "Something went wrong";
  res.status(statusCode).render("status", { statusCode, reason });
});

app.listen(port, () => {
  console.log(`The express app is ready on port ${ port }!`);
});