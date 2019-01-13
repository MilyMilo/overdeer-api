const Validator = require("validator");
const { isEmpty, typeCheck } = require("./utils");

validateCreateGroupInput = data => {
  let errors = {};

  const typeMap = {
    name: "string",
    description: "string",
    isPrivate: "boolean"
  };

  const { typeErrors, isValid } = typeCheck(data, typeMap);
  if (!isValid) {
    return { errors: typeErrors, isValid, isType: true };
  }

  if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Name must be between 2 and 30 characters";
  }

  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }

  if (!Validator.isLength(data.description, { max: 300 })) {
    errors.description = "Description must be at most 300 characters";
  }

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

validateUpdateGroupInput = data => {
  let errors = {};

  const typeMap = {
    name: "string?",
    description: "string?",
    isPrivate: "boolean?"
  };

  const { typeErrors, isValid } = typeCheck(data, typeMap);
  if (!isValid) {
    return { errors: typeErrors, isValid, isType: true };
  }

  if ("name" in data) {
    if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
      errors.name = "Name must be between 2 and 30 characters";
    }

    if (Validator.isEmpty(data.name)) {
      errors.name = "Name field is required";
    }
  }

  if ("description" in data) {
    if (!Validator.isLength(data.description, { max: 300 })) {
      errors.description = "Description must be at most 300 characters";
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

module.exports = {
  validateCreateGroupInput,
  validateUpdateGroupInput
};
