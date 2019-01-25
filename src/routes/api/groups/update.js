const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const slugify = require("slug");
const d = require("debug")("api:groups:update");

const { validateUpdateGroupInput } = require("../../../validation/groups");

const Group = require("../../../models/Group");

/**
 * @route PUT /api/groups/:slug
 * @desc Update group by slug
 * @access Private
 */
router.put(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const slug = ctx.params.slug;
    const uid = ctx.state.user.id;

    const { errors, isValid, isType } = validateUpdateGroupInput(
      ctx.request.body
    );

    if (!isValid) {
      if (isType) ctx.status = 400;
      else ctx.status = 422;

      ctx.body = errors;
      return;
    }

    const group = await Group.findOne({ slug });
    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    if (uid !== group.owner.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to update this group" };
      return;
    }

    const body = ctx.request.body;
    if ("name" in body) {
      // TODO: Create redirect to new slug?
      const newName = body.name;
      const newSlug = slugify(newName);

      const exGroup = await Group.find({
        $or: [{ slug: newSlug }, { name: newName }]
      });

      if (exGroup.length > 0) {
        ctx.status = 409;
        ctx.body = { error: "This name is already taken" };
        return;
      }

      group.name = newName;
      group.slug = newSlug;
    }

    if ("description" in body) {
      group.description = body.description;
    }

    if ("isPrivate" in body) {
      group.isPrivate = body.isPrivate;
    }

    try {
      await group.save();
      ctx.status = 200;
      ctx.body = {
        name: group.name,
        slug: group.slug,
        description: group.description,
        isPrivate: group.isPrivate
      };
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
