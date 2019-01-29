const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");

const { httpError } = require("../utils");

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
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    // Not a member
    const exUser = group.members.findIndex(id => id.toString() === uid);
    if (exUser < 0) {
      return httpError(
        ctx,
        409,
        "GROUPS/MEMBER_NOT_FOUND",
        "You are not a member of this group"
      );
    }

    try {
      await Group.findOneAndUpdate(
        { _id: group._id },
        { $pull: { members: uid } }
      );

      ctx.status = 204;
    } catch (err) {
      ctx.throw({ error: "GROUPS/LEAVE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
