if (
  process.env.NODE_ENV === "production" ||
  // CircleCI should use the same variables as prod since they both come from ENV
  process.env.NODE_ENV === "circle"
) {
  module.exports = require("./prod");
} else {
  module.exports = require("./dev");
}
