const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Whoops! Something went wrong. Couldnt find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  console.log("getPlacesByUserId");

  //let places
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate(
      "places",
      null,
      null,
      {
        sort: {
          createdAt: -1,
        },
      }
    );
  } catch (err) {
    const error = new HttpError(
      err || "Something went wrong. Couldnt find places for defined users.",
      500
    );
    return next(error);
  }
  // if places...
  if (!userWithPlaces || userWithPlaces.places.length == 0) {
    return next(
      new HttpError("Could not find places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  console.log("create place");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let creator = mongoose.Types.ObjectId(req.userData.userId);

  console.log(creator);

  const { title, description, blog } = req.body;

  console.log(req.body);
  console.log(req.file.path);

  const createdPlace = new Place({
    title,
    description,
    blog,
    image: req.file.path,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again!", 500));
  }

  if (!user) {
    return next(new HttpError("Couldnt find user for provided id", 404));
  }

  try {
    const session = await mongoose.startSession();
    console.log("session");
    session.startTransaction();
    console.log("start Transaction");
    await createdPlace.save({ session: session });
    console.log("save session");
    user.places.push(createdPlace);
    console.log("user push");
    await user.save({ session: session });
    console.log("user savbe");
    await session.commitTransaction();
    console.log("commit transactino");
  } catch (e) {
    console.log(e);
    return next(new HttpError("Creating place failed, please try again", 500));
  }

  res.status(201).json({ place: createdPlace.toObject({ getters: true }) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs passed", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not authorized to edit this place",
      401
    );

    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError("Couldnt find the place for provided id", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not authorized to delete this place",
      401
    );

    return next(error);
  }

  const imagePath = place.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    if (err) console.log(err);
  });
  res.status(200).json({ message: "Successfully deleted." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
