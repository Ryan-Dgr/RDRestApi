const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const Joi = require("joi");
const mongoose = require("mongoose");
const { User, validate } = require("../models/user");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const asyncMiddleware = require("../middleware/async");

const router = express.Router();

function validateRoleUpdate(roleUpdate) {
  const schema = Joi.object({
    isAdmin: Joi.boolean().required(),
  });

  return schema.validate(roleUpdate);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// current user
router.get(
  "/me",
  auth,
  asyncMiddleware(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    res.send(user);
  }),
);

// update user role - admin only
router.patch(
  "/:id/role",
  auth,
  admin,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige user id");
    }

    const result = validateRoleUpdate(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: req.body.isAdmin },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).send("user niet gevonden");
    }

    res.send(user);
  }),
);

// register new user
router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const result = validate(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).send("User already registered.");
    }

    user = new User(_.pick(req.body, ["name", "email", "password"]));

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    const token = user.generateAuthToken();

    res
      .header("x-auth-token", token)
      .send(_.pick(user, ["_id", "name", "email"]));
  }),
);

module.exports = router;
