const express = require("express");
const router = express.Router();
const { CheckToken } = require("../controllers/authController");
const { getAllHomepagesongs } = require("../controllers/MusicController");

router.get("/homepage", CheckToken, getAllHomepagesongs);

module.exports = router;
