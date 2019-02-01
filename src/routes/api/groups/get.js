const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

const { httpError } = require("../utils");

/**
 * @route GET /api/groups/:slug
 * @desc Get group by slug
 * @access Private
 */
router.get(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;
    const uid = ctx.state.user.id;

    const group = await Group.findOne({ slug })
      .select("-__v")
      .populate("members", "-__v -email -password -registeredAt")
      .populate("owner", "-__v -email -password -registeredAt");

    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    const members = group.members.map(member => member._id.toString());

    // private group but the user is not a member
    if (group.isPrivate && !members.includes(uid)) {
      ctx.status = 200;
      ctx.body = {
        name: group.name,
        slug: group.slug,
        isPrivate: group.isPrivate
      };

      return;
    }

    const events = await Event.find({ groupId: group._id })
      .select("-__v -groupId -comments")
      .populate("creator", "-__v -email -password -registeredAt");

    ctx.status = 200;
    // reverse lookup - basically merge group with it's events
    ctx.body = { ...group._doc, events };
  }
);

module.exports = router.routes();
