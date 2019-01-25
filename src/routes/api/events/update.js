const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const d = require("debug")("api:events:update");

const { validateUpdateEventInput } = require("../../../validation/events");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

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
      if (isType) ctx.status = 400;
      else ctx.status = 422;

      ctx.body = errors;
      return;
    }

    const { slug, eid } = ctx.params;
    const uid = ctx.state.user.id;

    // TODO: Move to members check
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

    if (uid !== event.creator.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to update this event" };
      return;
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
        date: event.date
      };
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
