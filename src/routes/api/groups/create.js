const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const slugify = require("slug");
const d = require("debug")("api:groups:create");

const Group = require("../../../models/Group");

const { httpError } = require("../utils");
const { validateCreateGroupInput } = require("../../../validation/groups");

/**
 * @route POST /api/groups
 * @desc Create a group
 * @access Private
 */
router.post(
  "/groups",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    d(ctx.request.body);
    const { errors, isValid, isType } = validateCreateGroupInput(
      ctx.request.body
    );

    if (!isValid) {
      if (isType) return httpError(ctx, 400, "VALIDATION/TYPE_ERROR", errors);
      else return httpError(ctx, 422, "VALIDATION/VALIDATION_ERROR", errors);
    }

    const { name, description, isPrivate } = ctx.request.body;
    const uid = ctx.state.user.id;

    const slug = slugify(name);

    const group = await Group.findOne({ slug });
    if (group) {
      return httpError(
        ctx,
        409,
        "GROUPS/ALREADY_EXISTS",
        "This name is already taken"
      );
    }

    const newGroup = await new Group({
      name,
      slug,
      description,
      isPrivate,
      owner: uid,
      members: [uid]
    });

    try {
      await newGroup.save();
      ctx.status = 201;
      ctx.body = {
        _id: newGroup._id,
        name: newGroup.name,
        slug: newGroup.slug,
        description: newGroup.description,
        isPrivate: newGroup.isPrivate
      };
    } catch (err) {
      ctx.throw({ error: "GROUPS/CREATE_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
