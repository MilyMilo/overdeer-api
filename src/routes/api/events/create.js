const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const d = require("debug")("api:events:create");

const { validateCreateEventInput } = require("../../../validation/events");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

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
    const newEvent = await new Event({
      name,
      description,
      type,
      subject,
      date,
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
        date: newEvent.date
      };
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
