const crypto = require("crypto");
const path = require("path");

const Router = require("koa-router");
const router = new Router();
const multer = require("koa-multer");
const passport = require("koa-passport");

const File = require("../../../models/File");

const { validateMulterFile } = require("../../../validation/files");

const config = require("../../../../config");

const storage = multer.diskStorage({
  destination: config.UPLOAD_DIR,
  filename: (req, file, cb) => {
    crypto.pseudoRandomBytes(16, (err, raw) => {
      if (err) return cb(err);

      // TODO: Once again, proper validation
      cb(null, raw.toString("hex") + path.extname(file.originalname));
    });
  }
});

const upload = multer({
  fileFilter: validateMulterFile,
  limits: { fileSize: 5 * 1024 * 1024 }, // (5MB) TODO: Should probably go to some kind of global settings
  storage
}).array("files", 10);

router.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  async (ctx, next) => {
    try {
      await upload(ctx, next);
    } catch (err) {
      switch (err.code) {
        case "LIMIT_UNEXPECTED_FILE":
          ctx.status = 400;
          ctx.body = { error: "File upload limit exceeded" };
          break;
        case "LIMIT_FILE_SIZE":
          ctx.status = 400;
          ctx.body = { error: "File size limit exceeded" };
          break;
        case "DISALLOWED_FILE_TYPE":
          ctx.status = 400;
          ctx.body = { error: "Disallowed file type" };
          break;

        default:
          ctx.throw(err);
          break;
      }
    }
  },
  async ctx => {
    const files = ctx.req.files;
    const uid = ctx.state.user.id;

    const pendingFiles = [];
    const uploadedFiles = [];

    files.forEach(file => {
      const uploadedFile = new File({
        originalName: file.originalname,
        fileName: file.filename,
        url: `${config.STATIC_DIR}/${file.filename}`,
        size: file.size,
        owner: uid
      });

      pendingFiles.push(uploadedFile.save());

      const fileCopy = Object.assign({}, uploadedFile._doc);
      delete fileCopy.__v;
      uploadedFiles.push(fileCopy);
    });

    try {
      await Promise.all(pendingFiles);
      ctx.status = 200;
      ctx.response.body = uploadedFiles;
    } catch (err) {
      ctx.throw(err);
    }
  }
);

module.exports = router.routes();
