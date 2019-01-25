const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");

/**
 * @route GET /api/groups/:slug/leave
 * @desc Leave a group by slug
 * @access Private
 */
router.post(
  "/groups/:slug/leave",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;
    const uid = ctx.state.user.id;

    const group = await Group.findOne({ slug });
    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    // Not a member
    const exUser = group.members.findIndex(id => id.toString() === uid);
    if (exUser < 0) {
      ctx.status = 409;
      ctx.body = { error: "You are not a member of this group" };
      return;
    }

    try {
      await Group.findOneAndUpdate(
        { _id: group._id },
        { $pull: { members: uid } }
      );

      ctx.status = 204;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
