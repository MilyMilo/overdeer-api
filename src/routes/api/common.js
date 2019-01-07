const Router = require("koa-router");
const router = new Router();

/**
 * @route GET /api/
 * @desc API index route
 * @access Public
 */
router.get("/", async ctx => {
  ctx.body = "Hello API!";
});

module.exports = router.routes();
