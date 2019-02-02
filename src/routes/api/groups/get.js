const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

const { httpError } = require("../utils");

/**
 * @route GET /api/groups/:slug
 * @desc Get group by slug
 * @access Private
 */
router.get(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;
    const uid = ctx.state.user.id;

    const count = parseInt(ctx.request.query.eventsCount) || 15;
    const page = parseInt(ctx.request.query.eventsPage) || 1;
    const eventsOnly = ctx.request.query.eventsOnly === "true" ? true : false;
    const sorting = ["newest", "oldest"].includes(ctx.request.query.sorting)
      ? ctx.request.query.sorting
      : "oldest";

    if (count < 0 || page < 0) {
      return httpError(
        ctx,
        400,
        "EVENTS/NEGATIVE_PAGINATION",
        "Negative pagination parameters are not allowed"
      );
    }

    const group = await Group.findOne({ slug })
      .select("-__v")
      .populate("members", "-__v -email -password -registeredAt")
      .populate("owner", "-__v -email -password -registeredAt");

    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    const members = group.members.map(member => member._id.toString());

    // private group but the user is not a member
    if (group.isPrivate && !members.includes(uid)) {
      ctx.status = 200;
      ctx.body = {
        name: group.name,
        slug: group.slug,
        isPrivate: group.isPrivate
      };

      return;
    }

    // TODO: Refactor
    const events =
      sorting === "oldest"
        ? await Event.find({ groupId: group._id })
            .skip(count * page - count)
            .limit(count)
            .select("-__v -groupId -comments")
            .populate("creator", "-__v -email -password -registeredAt")
        : await Event.find({ groupId: group._id })
            .sort({ createdAt: "desc" })
            .skip(count * page - count)
            .limit(count)
            .select("-__v -groupId -comments")
            .populate("creator", "-__v -email -password -registeredAt");

    ctx.status = 200;
    if (eventsOnly) {
      ctx.body = { events };
      return;
    }

    // reverse lookup - basically merge group with it's events
    ctx.body = { ...group._doc, events };
  }
);

module.exports = router.routes();
