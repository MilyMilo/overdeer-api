const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const Sentry = require("@sentry/node");

const User = require("../src/models/User");
const config = require("./index");

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.JWT_SECRET;

module.exports = passport => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);

        if (user) {
          return done(null, user);
        }

        return done(null, false);
      } catch (err) {
        if (process.env.NODE_ENV === "production") {
          Sentry.captureException(err);
        } else {
          console.error(err);
        }
      }
    })
  );
};
