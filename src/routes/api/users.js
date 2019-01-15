const Router = require("koa-router");
const passport = require("koa-passport");
const bcrypt = require("bcryptjs");

const promisify = require("bluebird").promisify;
const jwt = require("jsonwebtoken");
const jwtSign = promisify(jwt.sign);

const User = require("../../models/User");
const config = require("../../../config");

const router = new Router();

const {
  validateRegisterInput,
  validateLoginInput
} = require("../../validation/users");

/**
 * @route POST /api/login
 * @desc Login a user
 * @access Public
 */
router.post("/login", async ctx => {
  const { errors, isValid } = validateLoginInput(ctx.request.body);
  if (!isValid) {
    if (isType) ctx.status = 400;
    else ctx.status = 422;
    ctx.body = errors;
    return;
  }

  const { email, password } = ctx.request.body;
  const user = await User.findOne({ email });
  if (!user) {
    ctx.set("WWW-Authenticate", `Bearer realm="basicLogin"`);
    ctx.status = 401;
    ctx.body = { login: "Invalid user or/and password" };
    return;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    ctx.set("WWW-Authenticate", `Bearer realm="basicLogin"`);
    ctx.status = 401;
    ctx.body = { login: "Invalid user or/and password" };
    return;
  }

  const payload = { id: user.id, username: user.username };

  try {
    const token = await jwtSign(payload, config.JWT_SECRET, {
      expiresIn: 3600
    });

    ctx.status = 200;
    ctx.body = { token: `Bearer ${token}` };
    return;
  } catch (err) {
    ctx.throw(err);
  }
});

/**
 * @route POST /api/register
 * @desc Register an user
 * @access Public
 */
router.post("/register", async ctx => {
  const { errors, isValid, isType } = validateRegisterInput(ctx.request.body);

  if (!isValid) {
    if (isType) ctx.status = 400;
    else ctx.status = 422;

    ctx.body = errors;
    return;
  }

  const { username, email, password } = ctx.request.body;
  const user = await User.findOne({ email });

  if (user) {
    ctx.status = 409;
    ctx.body = { email: "This email is already registered" };
    return;
  }

  const newUser = new User({
    username,
    email,
    password
  });

  let salt = await bcrypt.genSalt();
  let hash = await bcrypt.hash(newUser.password, salt);
  newUser.password = hash;

  try {
    await newUser.save();
    ctx.status = 201;
    ctx.body = {
      username: newUser.username,
      email: newUser.email
    };
  } catch (err) {
    ctx.throw(err);
  }
});

/**
 * @route GET /api/current
 * @desc Returns user authenticated during the request
 * @access Private
 */
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    ctx.body = {
      id: ctx.state.user.id,
      username: ctx.state.user.username,
      email: ctx.state.user.email
    };
  }
);

module.exports = router.routes();
