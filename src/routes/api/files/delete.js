const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const File = require("../../../models/File");

router.delete(
  "/upload/:id",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const fid = ctx.params.id;
    const uid = ctx.state.user.id;

    const file = await File.findById(fid);

    if (!file) {
      ctx.status = 404;
      ctx.response.body = { error: "File not found" };
      return;
    }

    if (uid !== file.owner.toString()) {
      ctx.status = 403;
      ctx.response.body = {
        error: "Insufficient permissions to delete this file"
      };
      return;
    }

    try {
      await file.remove();
      ctx.status = 204;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
