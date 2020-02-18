const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const signup = async (req, res, next) => {
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
      $or: [{ email: email }, { username: username }]
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
    username,
    //image: req.file.path,
    password: hashedPassword,
    places: []
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
      "Trump2020_key",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Whoops! Something went wrong", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ user: createdUser.id, email: createdUser.email, token });
};

const login = async (req, res, next) => {
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

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token
  });
};

exports.signup = signup;
exports.login = login;
