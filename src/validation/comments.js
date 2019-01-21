const Validator = require("validator");
const { isEmpty, typeCheck } = require("./utils");

// rare case where the same validator is used for crates and updates
validateCommentInput = data => {
  let errors = {};

  const typeMap = {
    content: "string"
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

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

module.exports = {
  validateCommentInput
};
