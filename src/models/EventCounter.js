const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventCounterSchema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  seq: { type: Schema.Types.Number, default: 1 }
});

module.exports = Counter = mongoose.model("event-counters", EventCounterSchema);
