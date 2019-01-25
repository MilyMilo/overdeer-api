const Router = require("koa-router");

const router = new Router();

router.use("/api", require("./api/users"));
router.use("/api", require("./api/groups"));
router.use("/api", require("./api/events"));
router.use("/api", require("./api/comments"));
router.use("/api", require("./api/files"));

module.exports = router;
