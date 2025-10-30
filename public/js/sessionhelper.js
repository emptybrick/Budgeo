// public/js/sessionhelper.js

const isSessionValid = (session) => {
  // Passport keeps session.passport.user, not session.user
  if (!session || !session.passport || !session.passport.user) {
    return false;
  }

  // Optional custom time check (if you still want it)
  if (session.loginTime) {
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

    // Expire session after 24 hours (adjust as needed)
    if (hoursDiff > 24) {
      return false;
    }
  }

  return true;
};

const refreshSession = (req, callback) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    // Store some activity metadata if desired
    req.session.lastActivity = new Date().toISOString();

    // You can also refresh loginTime here if you want sliding expiration
    // req.session.loginTime = new Date().toISOString();

    req.session.save(callback);
  } else {
    callback(new Error("No valid session to refresh"));
  }
};

module.exports = {
  isSessionValid,
  refreshSession,
};
