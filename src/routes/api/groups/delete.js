const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");

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
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const uid = ctx.state.user.id;
    if (uid !== group.owner.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to delete this group" };
      return;
    }

    try {
      await Group.deleteOne({ slug });
      ctx.status = 204;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
