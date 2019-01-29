const Router = require("koa-router");
const router = new Router();

const Group = require("../../../models/Group");

const { httpError } = require("../utils");

/**
 * @route GET /api/groups
 * @desc Get groups
 * @access Public
 */
router.get("/groups", async ctx => {
  // Pagination defaults
  const count = parseInt(ctx.request.query.count) || 10;
  const page = parseInt(ctx.request.query.page) || 1;

  if (count < 0 || page < 0) {
    return httpError(
      ctx,
      400,
      "GROUPS/NEGATIVE_PAGINATION",
      "Negative pagination parameters are not allowed"
    );
  }

  // TODO: Allow opt-in authentication to display private groups
  const groups = await Group.find({ isPrivate: false })
    .select("-__v -members")
    .skip(count * page - count)
    .limit(count)
    .populate("owner", "-__v -email -password -registeredAt");

  ctx.status = 200;
  ctx.body = {
    groups,
    pagination: {
      // if the groups array is full, there might be some more groups, else start over from 1
      next: `/api/groups?page=${
        groups.length < page ? page + 1 : 1
      }&count=${count}`,
      // if the previous page would be more than 0, mark it otherwise mark the start
      previous: `/api/groups?page=${page - 1 > 0 ? page - 1 : 1}&count=${count}`
    }
  };
});

module.exports = router.routes();
