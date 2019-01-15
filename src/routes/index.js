const Router = require("koa-router");

const router = new Router();
const apiRouter = new Router();

const common = require("./api/common");
const users = require("./api/users");
const groups = require("./api/groups");
const events = require("./api/events");

apiRouter.use(common);
apiRouter.use(users);
apiRouter.use(groups);
apiRouter.use(events);

router.use("/api", apiRouter.routes());

module.exports = router;
