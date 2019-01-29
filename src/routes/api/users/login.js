const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcryptjs");

const promisify = require("bluebird").promisify;
const jwt = require("jsonwebtoken");
const jwtSign = promisify(jwt.sign);

const User = require("../../../models/User");
const config = require("../../../../config");

const { httpError } = require("../utils");
const { validateLoginInput } = require("../../../validation/users");

/**
 * @route POST /api/login
 * @desc Login a user
 * @access Public
 */
router.post("/login", async ctx => {
  const { errors, isValid, isType } = validateLoginInput(ctx.request.body);
  if (!isValid) {
    if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
    else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
  }

  const { email, password } = ctx.request.body;
  const user = await User.findOne({ email });
  if (!user) {
    ctx.set("WWW-Authenticate", `Bearer realm="basicLogin"`);
    return httpError(
      ctx,
      401,
      "USERS/INVALID_CREDENTIALS",
      "Invalid email or/and password"
    );
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    ctx.set("WWW-Authenticate", `Bearer realm="basicLogin"`);
    return httpError(
      ctx,
      401,
      "USERS/INVALID_CREDENTIALS",
      "Invalid email or/and password"
    );
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
    ctx.throw({ error: "USERS/LOGIN_INTERNAL", description: err });
  }
});

module.exports = router.routes();
