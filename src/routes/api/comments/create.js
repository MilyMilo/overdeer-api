const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const d = require("debug")("api:comments:create");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");
const { Comment } = require("../../../models/Comment");
const { File } = require("../../../models/File");

const { httpError } = require("../utils");
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
      if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
      else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
    }

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

    const event = await Event.findOne({
      groupId: group._id,
      id: eid
    });

    if (!event) {
      return httpError(ctx, 404, "EVENTS/NOT_FOUND", "Event not found");
    }

    const body = ctx.request.body;
    const content = body.content;

    let fileDocs = [];
    if ("files" in body) {
      const fileIds = body.files;
      fileDocs = await File.find({ _id: { $in: fileIds } });
    }

    const newComment = new Comment({
      content,
      files: fileDocs,
      creator: uid
    });

    try {
      await Event.findOneAndUpdate(
        { _id: event._id },
        { $push: { comments: newComment } }
      );
      ctx.status = 204;
    } catch (err) {
      ctx.throw({ error: "COMMENTS/CREATE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
