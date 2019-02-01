const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const d = require("debug")("api:events:create");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");
const { File } = require("../../../models/File");

const { httpError } = require("../utils");
const { validateCreateEventInput } = require("../../../validation/events");

/**
 * @route POST /api/groups/:slug/events
 * @desc Create a event
 * @access Private
 */
router.post(
  "/groups/:slug/events",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const { errors, isValid, isType } = validateCreateEventInput(
      ctx.request.body
    );

    if (!isValid) {
      if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
      else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
    }

    const slug = ctx.params.slug;
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

    const body = ctx.request.body;
    const { name, description, type, subject, date } = body;

    let fileDocs = [];
    if ("files" in body) {
      const fileIds = body.files;
      fileDocs = await File.find({ _id: { $in: fileIds } });
    }

    const newEvent = await new Event({
      name,
      description,
      type,
      subject,
      date,
      files: fileDocs,
      groupId: group._id,
      creator: uid
    });

    try {
      await newEvent.save();
      ctx.status = 201;
      ctx.body = {
        id: newEvent.id,
        name: newEvent.name,
        description: newEvent.description,
        type: newEvent.type,
        subject: newEvent.subject,
        date: newEvent.date,
        files: fileDocs
      };
    } catch (err) {
      ctx.throw({ error: "EVENTS/CREATE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
