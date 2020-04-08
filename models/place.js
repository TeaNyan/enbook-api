const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const placeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    blog: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Place", placeSchema);
