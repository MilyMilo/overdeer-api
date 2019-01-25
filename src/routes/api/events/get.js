const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

/**
 * @route GET /api/groups/:slug/events/:eid
 * @desc Get event by group slug and event id
 * @access Private
 */
router.get(
  "/groups/:slug/events/:eid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const { slug, eid } = ctx.params;
    const uid = ctx.state.user.id;

    // TODO: Differentiate between not found and not a member?
    // TODO: Move to members check
    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, members: uid }]
    });

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const event = await Event.findOne({
      groupId: group._id,
      id: eid
    })
      .select("-__v -groupId")
      .populate("creator", "-__v -email -password -registeredAt");

    if (!event) {
      ctx.status = 404;
      ctx.body = { error: "Event not found" };
      return;
    }

    ctx.status = 200;
    ctx.body = event._doc;
  }
);

module.exports = router.routes();
