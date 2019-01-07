const fs = require("fs");
const Koa = require("koa");
const morgan = require("koa-morgan");
const bodyParser = require("koa-bodyparser");
const passport = require("koa-passport");
const Sentry = require("@sentry/node");

const config = require("../config");

// App bootstrap
const app = new Koa();
app.use(bodyParser());

// Logging
if (process.env.NODE_ENV === "production") {
  const accessLog = fs.createWriteStream("./access.log", {
    flags: "a"
  });

  app.use(morgan("combined", { stream: accessLog }));

  // Sentry reporting for production
  Sentry.init({
    dsn: config.SENTRY_DSN
  });

  app.on("error", err => {
    Sentry.captureException(err);
  });
} else {
  app.use(morgan("dev", process.stdout));

  app.on("error", err => {
    console.error(err);
  });
}

// Passport + JWT config
require("../config/passport")(passport);
app.use(passport.initialize());

// Routing
const router = require("./routes");
app.use(router.routes());
app.use(router.allowedMethods());

// If run directly not just imported
if (!module.parent) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT);

  const db = require("./database");
}

module.exports = app;
