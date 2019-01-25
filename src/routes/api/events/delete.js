const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

/**
 * @route DELETE /api/groups/:slug/events/:eid
 * @desc Delete event by event id
 * @access Private
 */
router.delete(
  "/groups/:slug/events/:eid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const { slug, eid } = ctx.params;
    const uid = ctx.state.user.id;

    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, members: uid }]
    });

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const event = await Event.findOne({ groupId: group._id, id: eid });

    if (!event) {
      ctx.status = 404;
      ctx.body = { error: "Event not found" };
      return;
    }

    if (uid !== event.creator.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to delete this event" };
      return;
    }

    try {
      await Event.deleteOne({ id: eid });
      ctx.status = 204;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
