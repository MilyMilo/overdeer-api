const Router = require("koa-router");
const router = new Router();

router.use(require("./upload"));
router.use(require("./delete"));

module.exports = router.routes();
