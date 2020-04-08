const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const JWT_KEY = "Trump2020_key";

const signup = async (req, res, next) => {
  console.log("here");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, username, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
  } catch (err) {
    const error = new HttpError("Whoops! Something went wrong", 500);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again", 500));
  }

  if (existingUser) {
    const error = new HttpError(
      "User already exists. Please log in instead.",
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    username: email,
    //image: req.file.path,
    password: hashedPassword,
    posts: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Whoops! Something went wrong", 500);
    return next(error);
  }

  res.cookie("token", token, {
    maxAge: 60 * 60 * 1000 * 24,
    path: "/",
  });

  return res
    .status(201)
    .json({ email: createdUser.email, userId: createdUser.id });
};

const login = async (req, res, next) => {
  console.log("here");
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Whoops! Something went wrong. Logging in failed.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials", 401);
    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HttpError("Could not log you in. Try again", 500));
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials", 401);
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "Trump2020_key",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Whoops! Something went wrong", 500);
    return next(error);
  }

  res.cookie("token", token, {
    maxAge: 60 * 60 * 1000 * 24,
    path: "/",
  });

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
  });
};

const me = async (req, res, next) => {
  if (req.headers.cookie) {
    let token = req.headers.cookie.split("=")[1];
    try {
      let decoded = jwt.verify(token, JWT_KEY);
      return res.json({ email: decoded.email, userId: decoded.userId });
    } catch (e) {
      const error = new HttpError("Token is no longer valid!", 401);
      return next(error);
    }
  }

  return res.json(null);
};

const logout = async (req, res, next) => {
  if (req.headers.cookie) {
    const token = req.headers.cookie.split("=")[1];

    res.cookie("token", token, {
      maxAge: new Date(0),
      path: "/",
    });

    return res.json({ message: "success" });
  }
  const error = new HttpError("You are not logged in", 401);
  return next(error);
};

exports.signup = signup;
exports.login = login;
exports.me = me;
exports.logout = logout;
