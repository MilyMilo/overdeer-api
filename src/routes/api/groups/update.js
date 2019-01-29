const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const slugify = require("slug");
const d = require("debug")("api:groups:update");

const Group = require("../../../models/Group");

const { httpError } = require("../utils");
const { validateUpdateGroupInput } = require("../../../validation/groups");
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
      if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
      else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
    }

    const group = await Group.findOne({ slug });
    if (!group) {
      return httpError(ctx, 404, "GROUPS/NOT_FOUND", "Group not found");
    }

    if (uid !== group.owner.toString()) {
      return httpError(
        ctx,
        403,
        "GROUPS/NOT_PERMITTED",
        "Insufficient permissions to update this group"
      );
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
        return httpError(
          ctx,
          409,
          "GROUPS/ALREADY_EXISTS",
          "This name is already taken"
        );
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
      ctx.throw({ error: "GROUPS/UPDATE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
