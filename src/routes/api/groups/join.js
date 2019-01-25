const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");

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
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const exUser = group.members.findIndex(id => id.toString() === uid);
    if (exUser > -1) {
      ctx.status = 409;
      ctx.body = { error: "You are already a member of this group" };
      return;
    }

    try {
      await Group.findOneAndUpdate(
        { _id: group._id },
        { $push: { members: uid } }
      );

      ctx.status = 200;
      ctx.body = group;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
