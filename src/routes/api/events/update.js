const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const d = require("debug")("api:events:update");

const { httpError } = require("../utils");
const { validateUpdateEventInput } = require("../../../validation/events");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");
const { File } = require("../../../models/File");

/**
 * @route PUT /api/groups/:slug/event/:eid
 * @desc Update event by event id
 * @access Private
 */
router.put(
  "/groups/:slug/events/:eid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const { errors, isValid, isType } = validateUpdateEventInput(
      ctx.request.body
    );

    if (!isValid) {
      if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
      else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
    }

    const { slug, eid } = ctx.params;
    const uid = ctx.state.user.id;

    // TODO: Move to members check
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

    if (uid !== event.creator.toString()) {
      return httpError(
        ctx,
        403,
        "EVENTS/NOT_PERMITTED",
        "Insufficient permissions to update this event"
      );
    }

    const body = ctx.request.body;

    if ("name" in body) {
      event.name = body.name;
    }

    if ("description" in body) {
      event.description = body.description;
    }

    if ("isPrivate" in body) {
      event.isPrivate = body.isPrivate;
    }

    if ("type" in body) {
      // it should be already validated
      event.type = body.type;
    }

    if ("subject" in body) {
      // it also should be already validated
      event.subject = body.subject;
    }

    if ("date" in body) {
      event.date = body.date;
    }

    let fileDocs = [];
    if ("files" in body) {
      const fileIds = body.files;
      fileDocs = await File.find({ _id: { $in: fileIds } });
      event.files = fileDocs;
    }

    try {
      await event.save();
      ctx.status = 200;
      ctx.body = {
        _id: event._id,
        id: event.id,
        name: event.name,
        description: event.description,
        type: event.type,
        subject: event.subject,
        date: event.date,
        files: event.files
      };
    } catch (err) {
      ctx.throw({ error: "EVENTS/UPDATE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
