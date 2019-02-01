const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

const { httpError } = require("../utils");

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

    const group = await Group.findOne({ slug });
    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    const exUser = group.members.findIndex(id => id.toString() === uid);
    if (exUser < 0) {
      return httpError(
        ctx,
        403,
        "GROUPS/MEMBER_NOT_FOUND",
        "You are not a member of this group"
      );
    }

    const event = await Event.findOne({ groupId: group._id, id: eid });

    if (!event) {
      return httpError(ctx, 404, "EVENTS/NOT_FOUND", "Event not found");
    }

    if (uid !== event.creator.toString()) {
      return httpError(
        ctx,
        403,
        "EVENTS/NOT_PERMITTED",
        "Insufficient permissions to delete this event"
      );
    }

    try {
      await Event.deleteOne({ id: eid });
      ctx.status = 204;
    } catch (err) {
      ctx.throw({ error: "EVENTS/DELETE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
