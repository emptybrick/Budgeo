const {
  isSessionValid,
  refreshSession,
} = require("../public/js/sessionhelper.js");

//check if user is signed in with enhanced session validation
const isSignedIn = (req, res, next) => {
  // Check if session exists and user is logged in

  if (!req.session || !req.session.user || !req.session.user._id || !req.user) {
    return res.redirect("/");
  }

  // Validate session (check if it's not expired)
  if (!isSessionValid(req.session)) {
    // Session is invalid, destroy it and redirect to login
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error:", err);
      }
      res.clearCookie("budgeo.sid");
      return res.redirect("/budgeo/auth/sign-in?signedOut=true");
    });
  }
  // Refresh session activity timestamp
  refreshSession(req, (err) => {
    if (err) {
      console.log("Session refresh error:", err);
      // Continue anyway, don't block the request
    }
    next();
  });
};

module.exports = isSignedIn;
