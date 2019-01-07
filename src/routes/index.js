const Router = require("koa-router");

const router = new Router();
const apiRouter = new Router();

const common = require("./api/common");
const users = require("./api/users");

apiRouter.use(common);
apiRouter.use(users);

router.use("/api", apiRouter.routes());

module.exports = router;
