const fs = require("fs");
const mongoose = require("mongoose");
const config = require("../../config");

const Schema = mongoose.Schema;

const FileSchema = new Schema({
  fileName: { type: Schema.Types.String },
  url: { type: Schema.Types.String },
  originalName: { type: Schema.Types.String },
  size: { type: Schema.Types.Number },
  owner: { type: Schema.Types.ObjectId, ref: "users" },
  uploadedAt: { type: Schema.Types.Date, default: Date.now }
});

FileSchema.pre("remove", async function(next) {
  try {
    fs.unlinkSync(`${config.UPLOAD_DIR}/${this.fileName}`);
  } catch (err) {
    return next(err);
  }

  next();
});

module.exports = File = mongoose.model("files", FileSchema);
