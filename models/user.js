const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  // image: { type: String, required: true },
  games: [{ type: mongoose.Types.ObjectId, required: true, ref: "Game" }],
  anime: [{ type: mongoose.Types.ObjectId, required: true, ref: "Anime" }],
  movies: [{ type: mongoose.Types.ObjectId, required: true, ref: "Movie" }],
  series: [{ type: mongoose.Types.ObjectId, required: true, ref: "Serie" }],
  sports: [{ type: mongoose.Types.ObjectId, required: true, ref: "Sport" }],
  books: [{ type: mongoose.Types.ObjectId, required: true, ref: "Book" }],
  photos: [{ type: mongoose.Types.ObjectId, required: true, ref: "Photo" }],
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
