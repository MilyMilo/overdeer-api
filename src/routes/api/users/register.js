const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcryptjs");

const User = require("../../../models/User");

const { httpError } = require("../utils");
const { validateRegisterInput } = require("../../../validation/users");

/**
 * @route POST /api/register
 * @desc Register an user
 * @access Public
 */
router.post("/register", async ctx => {
  const { errors, isValid, isType } = validateRegisterInput(ctx.request.body);

  if (!isValid) {
    if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
    else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
  }

  const { username, email, password } = ctx.request.body;
  const user = await User.findOne({ email });

  if (user) {
    return httpError(
      ctx,
      409,
      "USERS/ALREADY_EXISTS",
      "This email is already registered"
    );
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
    ctx.throw({ error: "USERS/REGISTER_INTERNAL", description: err });
  }
});

module.exports = router.routes();
