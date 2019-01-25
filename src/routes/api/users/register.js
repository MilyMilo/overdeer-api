const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcryptjs");

const User = require("../../../models/User");

const { validateRegisterInput } = require("../../../validation/users");

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

module.exports = router.routes();
