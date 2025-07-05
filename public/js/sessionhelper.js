const isSessionValid = (session) => {
  if (!session || !session.user) {
    return false;
  }

  // Check if session has login time and it's within 24 hours
  if (session.user.loginTime) {
    const loginTime = new Date(session.user.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

    if (hoursDiff > 1) {
      return false;
    }
  }

  return true;
};

const refreshSession = (req, callback) => {
  if (req.session && req.session.user) {
    req.session.user.lastActivity = new Date().toISOString();
    req.session.save(callback);
  } else {
    callback(new Error("No valid session to refresh"));
  }
};

module.exports = {
  isSessionValid,
  refreshSession,
};
