const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const fs = require("fs");
const path = require("path");

const usersRoutes = require("./routes/users-routes");
const placesRoutes = require("./routes/places-routes");

const app = express();

const url =
  "mongodb+srv://TeaKong:Teak1nesis@cluster0-g4qhi.mongodb.net/enbook?retryWrites=true&w=majority";

app.use(bodyParser.json());

// Allows images to be viewed

app.get("/", (req, res, next) => {
  res.send("Hello world");
});

app.use("/uploads/images", express.static(path.join("uploads", "images")));

// Allowed headers are Origin, X-requested-With, Content-Type, Accept, Authorization
// Allowed methods are GET, POST, PATCH, DELETE

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// All available routes

app.use("/api/users", usersRoutes);
app.use("/api/places", placesRoutes);

// If route is not defined, throw err

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// Generic 500 error and remove uploaded file if any

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "Whoops! Something went wrong!" });
});

// This is a fix for warning deprecated in mongooo

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

//ANCHOR  Connect and run server

mongoose
  .connect(url)
  .then(() => {
    console.log("Server is running on port 5000. Everything is fines.");
    app.listen(5000);
  })
  .catch((e) => console.log);
