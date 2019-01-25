const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcryptjs");

const promisify = require("bluebird").promisify;
const jwt = require("jsonwebtoken");
const jwtSign = promisify(jwt.sign);

const User = require("../../../models/User");
const config = require("../../../../config");

const { validateLoginInput } = require("../../../validation/users");

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

module.exports = router.routes();
