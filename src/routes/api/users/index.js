const Router = require("koa-router");
const router = new Router();

router.use(require("./current"));
router.use(require("./login"));
router.use(require("./register"));

module.exports = router.routes();
