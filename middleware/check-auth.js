const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  if (req.headers.cookie) {
    let token = req.headers.cookie.split("=")[1];
    try {
      let decoded = jwt.verify(token, "Trump2020_key");
      req.userData = { userId: decoded.userId };
      next();
    } catch (e) {
      const error = new HttpError("'Authentication failed!", 401);
      return next(error);
    }
  }
};
