const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validate } = require("../models/user");

const router = express.Router();

// register new user
router.post("/", async (req, res) => {
  const result = validate(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  let user = await User.findOne({ email: req.body.email });

  if (user) {
    return res.status(400).send("User already registered.");
  }

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  // bcrypt maakt hash van ww
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  // @ts-ignore
  const token = user.generateAuthToken();

  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;
