const httpError = (ctx, code, error, description) => {
  ctx.status = code;
  ctx.body = {
    error,
    description
  };

  return;
};

module.exports = { httpError };
