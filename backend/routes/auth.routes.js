const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const passport = require("passport");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/google", authController.googleAuth);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  authController.googleCallback
);

module.exports = router;
