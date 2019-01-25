const Router = require("koa-router");
const router = new Router();

router.use(require("./create"));
router.use(require("./delete"));
router.use(require("./get"));
router.use(require("./join"));
router.use(require("./leave"));
router.use(require("./list"));
router.use(require("./update"));

module.exports = router.routes();
