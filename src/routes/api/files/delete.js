const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const { File } = require("../../../models/File");

const { httpError } = require("../utils");

/**
 * @route POST /api/upload/:id
 * @desc Delete a file
 * @access Private
 */
router.delete(
  "/upload/:id",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const fid = ctx.params.id;
    const uid = ctx.state.user.id;

    const file = await File.findById(fid);

    if (!file) {
      return httpError(ctx, 404, "FILES/NOT_FOUND", "File not found");
    }

    if (uid !== file.owner.toString()) {
      return httpError(
        ctx,
        403,
        "FILES/NOT_PERMITTED",
        "Insufficient permissions to delete this file"
      );
    }

    try {
      await file.remove();
      ctx.status = 204;
    } catch (err) {
      ctx.throw({ error: "FILES/DELETE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
