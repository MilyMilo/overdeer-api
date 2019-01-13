const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // _id
  username: { type: Schema.Types.String },
  email: { type: Schema.Types.String },
  password: { type: Schema.Types.String },
  avatar: { type: Schema.Types.String, required: false, default: "" },
  registeredAt: { type: Schema.Types.Date, required: false, default: Date.now }
});

module.exports = User = mongoose.model("users", UserSchema);
