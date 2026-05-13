const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const asyncMiddleware = require("../middleware/async");

const router = express.Router();

function validateLogin(login) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(login);
}

// login user
router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const result = validateLogin(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).send("Invalid email or password.");
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password,
    );

    if (!validPassword) {
      return res.status(400).send("Invalid email or password.");
    }

    const token = user.generateAuthToken();

    res.send(token);
  }),
);

module.exports = router;
