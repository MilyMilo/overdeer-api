const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const d = require("debug")("api:comments:update");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");
const { File } = require("../../../models/File");

const { httpError } = require("../utils");
const { validateCommentInput } = require("../../../validation/comments");

/**
 * @route PUT /api/groups/:slug/events/:eid/comments/:cid
 * @desc Update a comment
 * @access Private
 */
router.put(
  "/groups/:slug/events/:eid/comments/:cid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const { errors, isValid, isType } = validateCommentInput(ctx.request.body);

    if (!isValid) {
      if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
      else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
    }

    const { slug, cid, eid } = ctx.params;
    const uid = ctx.state.user.id;

    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, members: uid }]
    });

    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
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

    const body = ctx.request.body;
    const content = body.content;

    let fileDocs = [];
    if ("files" in body) {
      const fileIds = body.files;
      fileDocs = await File.find({ _id: { $in: fileIds } });
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
            "comments.$.files": fileDocs,
            "comments.$.updatedAt": Date.now()
          }
        }
      );

      ctx.status = 204;
    } catch (err) {
      ctx.throw({ error: "COMMENTS/UPDATE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
