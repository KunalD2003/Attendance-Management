const express = require("express");
const { login, signup, me } = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validators/authValidators");

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);

module.exports = router;
