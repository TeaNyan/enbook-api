const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

router.post(
  "/signup",
  //fileUpload.single("image"),
  [
    check("email").normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);
router.post("/logout", usersController.logout);
router.get("/me", usersController.me);

module.exports = router;
