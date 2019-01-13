const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
  // _id
  name: { type: Schema.Types.String },
  slug: { type: Schema.Types.String },
  description: { type: Schema.Types.String },
  isPrivate: { type: Schema.Types.Boolean, required: false, default: false },
  owner: { type: Schema.Types.ObjectId, ref: "users" },
  admins: [{ type: Schema.Types.ObjectId, ref: "users" }],
  members: [{ type: Schema.Types.ObjectId, ref: "users" }],
  createdAt: { type: Schema.Types.Date, default: Date.now }
});

module.exports = Group = mongoose.model("groups", GroupSchema);
