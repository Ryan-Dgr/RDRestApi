const express = require("express");
const config = require("config");

const router = express.Router();

// Home route that renders a Pug template
router.get("/", (req, res) => {
  res.render("index", {
    title: config.get("name"),
    message: "Workout API",
  });
});

module.exports = router;
