// Note: This is potentially insecure because we're only validating file extension
const validateMulterFile = function(req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|txt|pdf|md)$/)) {
    const error = new Error();
    error.code = "DISALLOWED_FILE_TYPE";
    return cb(error, false);
  }

  cb(null, true);
};

module.exports = {
  validateMulterFile
};
