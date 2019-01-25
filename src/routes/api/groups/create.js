const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");
const slugify = require("slug");
const d = require("debug")("api:groups:create");

const { validateCreateGroupInput } = require("../../../validation/groups");

const Group = require("../../../models/Group");

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
      if (isType) ctx.status = 400;
      else ctx.status = 422;

      ctx.body = errors;
      return;
    }

    const { name, description, isPrivate } = ctx.request.body;
    const uid = ctx.state.user.id;

    const slug = slugify(name);

    const group = await Group.findOne({ slug });
    if (group) {
      ctx.status = 409;
      ctx.body = { error: "This name is already taken" };
      return;
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
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
