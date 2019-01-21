const Router = require("koa-router");

const router = new Router();
const apiRouter = new Router();

const users = require("./api/users");
const groups = require("./api/groups");
const events = require("./api/events");
const comments = require("./api/comments");

apiRouter.use(users);
apiRouter.use(groups);
apiRouter.use(events);
apiRouter.use(comments);

router.use("/api", apiRouter.routes());

module.exports = router;
