const crypto = require("crypto");
const path = require("path");

const Router = require("koa-router");
const router = new Router();
const multer = require("koa-multer");
const passport = require("koa-passport");

const { File } = require("../../../models/File");

const { httpError } = require("../utils");
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

/**
 * @route POST /api/upload
 * @desc Upload a file using multi-part form
 * @access Private
 */
router.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  async (ctx, next) => {
    try {
      await upload(ctx, next);
    } catch (err) {
      switch (err.code) {
        case "LIMIT_UNEXPECTED_FILE":
          return httpError(
            ctx,
            400,
            "FILES/COUNT_LIMIT",
            "File upload limit exceeded"
          );

        case "LIMIT_FILE_SIZE":
          return httpError(
            ctx,
            400,
            "FILES/SIZE_LIMIT",
            "File size limit exceeded"
          );

        case "DISALLOWED_FILE_TYPE":
          return httpError(
            ctx,
            400,
            "FILES/DISALLOWED_FILE_TYPE",
            "Disallowed file type"
          );

        default:
          ctx.throw({ error: "FILES/UPLOAD_FAILED", description: err });
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
      ctx.throw({ error: "FILES/UPLOAD_INTERNAL", description: err });
    }
  }
);

module.exports = router.routes();
