const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Event = require("../../../models/Event");
const Group = require("../../../models/Group");

const { httpError } = require("../utils");

/**
 * @route DELETE /api/groups/:slug/events/:eid/comments/:cid
 * @desc Delete a comment
 * @access Private
 */
router.delete(
  "/groups/:slug/events/:eid/comments/:cid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const { slug, eid, cid } = ctx.params;
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

    const event = await Event.findOne({
      groupId: group._id,
      id: eid
    });

    if (!event) {
      return httpError(ctx, 404, "EVENTS/NOT_FOUND", "Event not found");
    }

    const comments = event.comments;
    const comment = comments.find(
      comment =>
        comment.creator.toString() === uid && comment._id.toString() === cid
    );

    if (!comment) {
      return httpError(ctx, 404, "COMMENTS/NOT_FOUND", "Comment not found");
    }

    try {
      await Event.findOneAndUpdate(
        { _id: event._id },
        { $pull: { comments: { _id: comment._id } } }
      );

      ctx.status = 204;
      return;
    } catch (err) {
      ctx.throw({ error: "COMMENTS/DELETE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
