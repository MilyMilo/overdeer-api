const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Event = require("../../../models/Event");
const Group = require("../../../models/Group");

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
    });

    if (!event) {
      ctx.status = 404;
      ctx.body = { error: "Event not found" };
      return;
    }

    const comments = event.comments;
    const comment = comments.find(
      comment =>
        comment.creator.toString() === uid && comment._id.toString() === cid
    );

    if (!comment) {
      ctx.status = 404;
      ctx.body = { error: "Comment not found" };
      return;
    }

    try {
      await Event.findOneAndUpdate(
        { _id: event._id },
        { $pull: { comments: { _id: comment._id } } }
      );

      ctx.status = 204;
      return;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
