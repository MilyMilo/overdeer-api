const Router = require("koa-router");
const passport = require("koa-passport");
const slugify = require("slug");

const {
  validateCreateGroupInput,
  validateUpdateGroupInput
} = require("../../validation/groups");
const Group = require("../../models/Group");

const router = new Router();

/**
 * @route POST /api/groups
 * @desc Create a group
 * @access Logged-in
 * @example
 * ```
 * ```
 */
router.post(
  "/groups",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
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
    const owner = ctx.state.user.id;

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
      owner,
      admins: [owner],
      members: [owner]
    });

    try {
      await newGroup.save();
      ctx.status = 201;
      ctx.body = {
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

/**
 * @route GET /api/groups
 * @desc Get groups
 * @access Public
 * @example
 * ```
 * ```
 */
router.get("/groups", async ctx => {
  // Pagination defaults
  const count = parseInt(ctx.request.query.count) || 10;
  const page = parseInt(ctx.request.query.page) || 1;

  if (count < 0 || page < 0) {
    ctx.status = 400;
    ctx.body = { error: "Negative pagination parameters are not allowed" };
    return;
  }

  const groups = await Group.find({ isPrivate: false })
    .select("-_id -__v")
    .skip(count * page - count)
    .limit(count);

  ctx.status = 200;
  ctx.body = {
    groups,
    pagination: {
      // if the groups array is full, there might be some more groups, else start over from 1
      next: `/api/groups?page=${
        groups.length > 0 ? page + 1 : 1
      }&count=${count}`,
      // if the previous page would be more than 0, mark it otherwise mark the start
      previous: `/api/groups?page=${page - 1 > 0 ? page - 1 : 1}&count=${count}`
    }
  };
});

/**
 * @route GET /api/groups/:slug
 * @params
 *  :slug -> String: Group's unique slug
 * @desc Get group by slug
 * @access Logged-in
 */
router.get(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;

    // find a public group by the slug or a private one where the user is an owner
    const group = await Group.findOne({
      $or: [{ slug, isPrivate: false }, { slug, owner: ctx.state.user.id }]
    })
      .select("-_id -__v")
      .populate("members", "-_id avatar username email")
      .populate("admins", "-_id avatar username email")
      .populate("owner", "-_id avatar username email");

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    ctx.status = 200;
    ctx.body = group;
  }
);

/**
 * @route PUT /api/groups/:slug
 * @desc Update group
 * @access Logged-in
 */
router.put(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;

    const { errors, isValid, isType } = validateUpdateGroupInput(
      ctx.request.body
    );

    if (!isValid) {
      // @TODO: Standard error returning format.
      // 400, and 422s should return key-names where the error occurred, and the rest just 'error'?
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

    if (ctx.state.user.id !== group.owner.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to update this group." };
      return;
    }

    const { body } = ctx.request;
    if ("name" in body) {
      const newName = body.name;
      const newSlug = slugify(newName);

      const exGroup = await Group.find({ $or: [{ newSlug }, { newName }] });
      if (exGroup.length > 0) {
        ctx.status = 409;
        ctx.body = { error: "This name is already taken" };
        return;
      }

      group.name = newName;
      group.slug = newSlug;
    }

    if ("description" in body) {
      const newDescription = body.description;
      group.description = newDescription;
    }

    if ("isPrivate" in body) {
      const newPrivacy = body.isPrivate;
      group.isPrivate = newPrivacy;
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

/**
 * @route DELETE /api/groups/:slug
 * @desc Delete group
 * @access Logged-in
 */
router.delete(
  "/groups/:slug",
  passport.authenticate("jwt", { session: false }),
  async ctx => {
    const slug = ctx.params.slug;

    const group = await Group.findOne({ slug });
    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "Group not found" };
      return;
    }

    if (ctx.state.user.id !== group.owner.toString()) {
      ctx.status = 403;
      ctx.body = { error: "Insufficient permissions to delete this group." };
      return;
    }

    await Group.deleteOne({ slug });
    ctx.status = 204;
  }
);

module.exports = router.routes();
