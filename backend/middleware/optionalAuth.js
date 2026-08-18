const jwt = require("jsonwebtoken");

// Unlike the main `protect` middleware, this NEVER blocks a request just for
// missing/invalid credentials. If a valid token is present it attaches req.user;
// otherwise req.user stays undefined and the route decides what to do from there.
// Used on routes where free content should be open to everyone, but paid content
// still needs to know who's asking.
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Invalid/expired token — just proceed as a logged-out request rather than erroring.
    }
  }

  next();
};

module.exports = optionalAuth;
