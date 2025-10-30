// middleware/is-signed-in.js
const { isSessionValid, refreshSession } = require("../public/js/sessionhelper.js");

const isSignedIn = (req, res, next) => {
  // Passport already attaches req.user when authenticated
  if (!req.user) {
    return res.redirect("/budgeo/auth/sign-in");
  }

  // Optional: validate session age
  if (!isSessionValid(req.session)) {
    req.session.destroy(err => {
      if (err) console.log("Session destruction error:", err);
      res.clearCookie("budgeo.sid");
      return res.redirect("/budgeo/auth/sign-in?signedOut=true");
    });
    return;
  }

  // Optional: refresh session timestamp
  refreshSession(req, err => {
    if (err) console.log("Session refresh error:", err);
    next();
  });
};

module.exports = isSignedIn;
