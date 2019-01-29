const Validator = require("validator");
const { isEmpty, typeCheck } = require("./utils");

// rare case where the same validator is used for creates and updates
validateCommentInput = data => {
  let errors = {};

  const typeMap = {
    content: "string",
    files: "array?"
  };

  const { typeErrors, isValid } = typeCheck(data, typeMap);
  if (!isValid) {
    return { errors: typeErrors, isValid, isType: true };
  }

  if (Validator.isEmpty(data.content)) {
    errors.content = "Content field is required";
  }

  if (!Validator.isLength(data.content, { min: 1, max: 1000 })) {
    errors.content = "Content must be between 1 and 1000 characters";
  }

  files: if ("files" in data) {
    if (data.files.length > 10) {
      errors.files = "Cannot attach more than 10 files";
      break files;
    }

    for (const file of data.files) {
      if (!Validator.isMongoId(file)) {
        errors.files = "Files contain invalid value";
        break;
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

module.exports = {
  validateCommentInput
};
