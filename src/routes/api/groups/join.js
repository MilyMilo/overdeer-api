const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");

const { httpError } = require("../utils");

/**
 * @route GET /api/groups/:slug/join
 * @desc Join a group by slug
 * @access Private
 */
router.post(
  "/groups/:slug/join",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;
    const uid = ctx.state.user.id;

    // TODO: Private group join mechanics, invite only?
    const group = await Group.findOne({
      slug,
      isPrivate: false
    });

    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    const exUser = group.members.findIndex(id => id.toString() === uid);
    if (exUser > -1) {
      return httpError(
        ctx,
        409,
        "GROUPS/MEMBER_EXISTS",
        "You are already a member of this group"
      );
    }

    try {
      await Group.findOneAndUpdate(
        { _id: group._id },
        { $push: { members: uid } }
      );

      ctx.status = 200;
      ctx.body = group;
    } catch (err) {
      ctx.throw({ error: "GROUPS/JOIN_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
