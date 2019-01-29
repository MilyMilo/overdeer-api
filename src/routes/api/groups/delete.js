const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");

const { httpError } = require("../utils");

/**
 * @route DELETE /api/groups/:slug
 * @desc Delete group by slug
 * @access Private
 */
router.delete(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;

    const group = await Group.findOne({ slug });
    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    const uid = ctx.state.user.id;
    if (uid !== group.owner.toString()) {
      return httpError(
        ctx,
        403,
        "GROUPS/NOT_PERMITTED",
        "Insufficient permissions to delete this group"
      );
    }

    try {
      await Group.deleteOne({ slug });
      ctx.status = 204;
    } catch (err) {
      ctx.throw({ error: "GROUPS/DELETE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
