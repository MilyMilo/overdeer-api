const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

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

    // find a public group by the slug or a private one where the user is an owner
    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, owner: uid }]
    })
      .select("-__v")
      .populate("members", "-__v -email -password -registeredAt")
      .populate("owner", "-__v -email -password -registeredAt");

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const events = await Event.find({ groupId: group._id })
      .select("-__v -groupId")
      .populate("creator", "-__v -email -password -registeredAt");

    ctx.status = 200;
    // reverse lookup - basically merge group with it's events
    ctx.body = { ...group._doc, events };
  }
);

module.exports = router.routes();
