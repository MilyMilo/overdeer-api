const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventCounter = require("./EventCounter");
const Event = require("./Event");

const GroupSchema = new Schema({
  // _id
  name: { type: Schema.Types.String },
  slug: { type: Schema.Types.String },
  description: { type: Schema.Types.String },
  isPrivate: { type: Schema.Types.Boolean, required: false, default: false },

  owner: { type: Schema.Types.ObjectId, ref: "users" },
  members: [{ type: Schema.Types.ObjectId, ref: "users" }],
  createdAt: { type: Schema.Types.Date, default: Date.now }
});

GroupSchema.pre("save", async function(next) {
  if (this.isNew) {
    try {
      await new EventCounter({
        _id: this._id
      }).save();
    } catch (err) {
      return next(err);
    }
  }

  next();
});

GroupSchema.pre("remove", async function(next) {
  try {
    await Event.deleteMany({ groupId: this._id });

    // EventCounter is created one per-group
    await EventCounter.deleteOne({ _id: this._id });
  } catch (err) {
    return next(err);
  }

  next();
});

module.exports = Group = mongoose.model("groups", GroupSchema);
