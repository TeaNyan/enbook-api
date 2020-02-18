const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error('Authentication failed!');
    }

    const decodedToken = jwt.verify(token, 'Trump2020_key');
    req.userData = { userId: decodedToken.userId };
    next();
  } catch {
    const error = new HttpError('Authentication failed!', 401);
    return next(error);
  }
};
