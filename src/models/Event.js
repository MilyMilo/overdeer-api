const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventCounter = require("./EventCounter");

const EventSchema = new Schema({
  // _id
  // public facing id
  id: { type: Schema.Types.Number },
  name: { type: Schema.Types.String },
  description: { type: Schema.Types.String },
  type: {
    type: Schema.Types.String
  },
  subject: {
    type: Schema.Types.String,
    enum: ["math", "english", "cs"] // TODO: Dynamic
  },
  date: { type: Schema.Types.Date },
  // files: [{ type: Schema.Types.String }],
  groupId: { type: Schema.Types.ObjectId, ref: "groups" },
  creator: { type: Schema.Types.ObjectId, ref: "users" },
  createdAt: { type: Schema.Types.Date, default: Date.now }
});

EventSchema.pre("save", async function(next) {
  if (this.isNew) {
    try {
      const counter = await EventCounter.findByIdAndUpdate(this.groupId, {
        $inc: { seq: 1 }
      });

      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = Event = mongoose.model("events", EventSchema);
