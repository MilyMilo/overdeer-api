const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const { FileSchema } = require("./File");

const CommentSchema = new Schema({
  content: { type: Schema.Types.String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: "users" },
  files: [FileSchema],
  createdAt: { type: Schema.Types.Date, default: Date.now },
  updatedAt: { type: Schema.Types.Date }
});

module.exports = {
  CommentSchema,
  Comment: mongoose.model("dummy-comments", CommentSchema)
};
