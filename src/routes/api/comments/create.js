const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const d = require("debug")("api:comments:create");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");
const { Comment } = require("../../../models/Comment");

const { validateCommentInput } = require("../../../validation/comments");

/**
 * @route POST /api/groups/:slug/events/:eid/comments
 * @desc Add a comment to specific event
 * @access Private
 */
router.post(
  "/groups/:slug/events/:eid/comments",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const { errors, isValid, isType } = validateCommentInput(ctx.request.body);

    if (!isValid) {
      if (isType) ctx.status = 400;
      else ctx.status = 422;

      ctx.body = errors;
      return;
    }

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

    const event = await Event.findOne({
      groupId: group._id,
      id: eid
    });

    if (!event) {
      ctx.status = 404;
      ctx.body = { error: "Event not found" };
      return;
    }

    const content = ctx.request.body.content;
    const newComment = new Comment({
      content,
      creator: uid
    });

    try {
      await Event.findOneAndUpdate(
        { _id: event._id },
        { $push: { comments: newComment } }
      );
      ctx.status = 204;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
