const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Group = require("../../../models/Group");
const Event = require("../../../models/Event");

const { httpError } = require("../utils");

/**
 * @route GET /api/groups/:slug/events/:eid
 * @desc Get event by group slug and event id
 * @access Private
 */
router.get(
  "/groups/:slug/events/:eid",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const { slug, eid } = ctx.params;
    const uid = ctx.state.user.id;

    const count = parseInt(ctx.request.query.commentsCount) || 15;
    const page = parseInt(ctx.request.query.commentsPage) || 1;
    const commentsOnly =
      ctx.request.query.commentsOnly === "true" ? true : false;

    // TODO: Upvotes system and 'top' sorting?
    const sorting = ["newest", "oldest"].includes(ctx.request.query.sorting)
      ? ctx.request.query.sorting
      : "oldest";

    if (count < 0 || page < 0) {
      return httpError(
        ctx,
        400,
        "COMMENTS/NEGATIVE_PAGINATION",
        "Negative pagination parameters are not allowed"
      );
    }

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
    })
      .select("-__v -groupId")
      .populate("creator", "-__v -email -password -registeredAt");

    if (!event) {
      return httpError(ctx, 404, "EVENTS/NOT_FOUND", "Event not found");
    }

    // TODO: Can this be done at the mongoose level?
    // push oldest (earliest) or newest (latest) comments
    const comments =
      sorting === "oldest"
        ? [...event.comments.splice(count * page - count, count)]
        : [
            ...event.comments
              .splice(event.comments.length - count * page, count)
              .reverse()
          ];

    ctx.status = 200;
    if (commentsOnly) {
      ctx.body = { comments };
      return;
    }

    ctx.body = { ...event._doc, comments };
  }
);

module.exports = router.routes();
