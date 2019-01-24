const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const d = require("debug")("api:comments");

const { Comment } = require("../../models/Comment");

const { validateCommentInput } = require("../../validation/comments");

/**
 * @route POST /api/groups/:slug/events/:eid/comments
 * @desc Add a comment to specific event
 * @access Private
 */
router.post(
  "/groups/:slug/events/:eid/comments",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
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

/**
 * @route PUT /api/groups/:slug/events/:eid/comments/:cid
 * @desc Update a comment
 * @access Private
 */
router.put(
  "/groups/:slug/events/:eid/comments/:cid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const { errors, isValid, isType } = validateCommentInput(ctx.request.body);

    if (!isValid) {
      if (isType) ctx.status = 400;
      else ctx.status = 422;

      ctx.body = errors;
      return;
    }

    const { slug, cid, eid } = ctx.params;
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
        {
          _id: event._id,
          "comments._id": comment._id
        },
        {
          $set: {
            "comments.$.content": content,
            "comments.$.updatedAt": Date.now()
          }
        }
      );

      ctx.status = 204;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
