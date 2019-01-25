const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

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
