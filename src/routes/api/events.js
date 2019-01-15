const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const d = require("debug")("api:events");

const {
  validateCreateEventInput,
  validateUpdateEventInput
} = require("../../validation/events");

const Group = require("../../models/Group");
const Event = require("../../models/Event");

/**
 * @route POST /api/groups/:slug
 * @desc Create a event
 * @access Private
 */
router.post(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const { errors, isValid, isType } = validateCreateEventInput(
      ctx.request.body
    );

    if (!isValid) {
      if (isType) ctx.status = 400;
      else ctx.status = 422;

      ctx.body = errors;
      return;
    }

    const slug = ctx.params.slug;
    const uid = ctx.state.user.id;

    // only allow creating in public groups or where the user is a member
    // TODO: Move to only allow in groups where the user is a member, and assume he has to join it if he wants to post there?
    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, members: uid }]
    });

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const { name, description, type, subject, date } = ctx.request.body;
    const creator = ctx.state.user.id;

    const newEvent = await new Event({
      name,
      description,
      type,
      subject,
      date,
      groupId: group._id,
      creator
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
        date: newEvent.date
      };
    } catch (err) {
      ctx.throw(err);
    }
  }
);

/**
 * @route GET /api/groups/:slug/:id
 * @desc Get event by group slug and event id
 * @access Private
 */
router.get(
  "/groups/:slug/:id",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;
    const eid = ctx.params.id;
    const uid = ctx.state.user.id;

    // TODO: Differentiate between not found and not a member?
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
    })
      .select("-__v -groupId")
      .populate("creator", "-__v -email -password -registeredAt");

    if (!event) {
      ctx.status = 404;
      ctx.body = { error: "Event not found" };
      return;
    }

    ctx.status = 200;
    ctx.body = event._doc;
  }
);

/**
 * @route PUT /api/groups/:slug/:id
 * @desc Update event by id
 * @access Private
 */
router.put(
  "/groups/:slug/:id",
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

    const slug = ctx.params.slug;
    const eid = ctx.params.id;
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

    const { body } = ctx.request;

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

/**
 * @route DELETE /api/groups/:slug/:id
 * @desc Delete event by id
 * @access Private
 */
router.delete(
  "/groups/:slug/:id",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;
    const eid = ctx.params.id;
    const uid = ctx.state.user.id;

    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, members: uid }]
    });

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    const event = await Event.findOne({ groupId: group._id, id: eid });

    if (!event) {
      ctx.status = 404;
      ctx.body = { error: "Event not found" };
      return;
    }

    if (uid !== event.creator.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to delete this event" };
      return;
    }

    await Event.deleteOne({ id: eid });
    ctx.status = 204;
  }
);

module.exports = router.routes();
