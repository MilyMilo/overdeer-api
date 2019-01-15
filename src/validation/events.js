const Validator = require("validator");
const { isEmpty, typeCheck } = require("./utils");

validateCreateEventInput = data => {
  let errors = {};

  const typeMap = {
    name: "string",
    description: "string",
    type: "string",
    subject: "string",
    // TODO: Common date format
    date: "number"
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

  if (!Validator.isLength(data.description, { max: 1000 })) {
    errors.description = "Description must be at most 1000 characters";
  }

  // TODO: Central or dynamic types
  if (!Validator.isIn(data.type, ["test", "quiz", "homework"])) {
    errors.type = "Provided event type is invalid";
  }

  if (!Validator.isIn(data.subject, ["math", "english", "cs"])) {
    errors.subject = "Provided event subject is invalid";
  }

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

validateUpdateEventInput = data => {
  let errors = {};

  const typeMap = {
    name: "string?",
    description: "string?",
    type: "string?",
    subject: "string?",
    date: "number?"
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
    if (!Validator.isLength(data.description, { max: 1000 })) {
      errors.description = "Description must be at most 1000 characters";
    }
  }

  if ("type" in data) {
    if (!Validator.isIn(data.type, ["test", "quiz", "homework"])) {
      errors.type = "Provided event type is invalid";
    }
  }

  if ("subject" in data) {
    if (!Validator.isIn(data.subject, ["math", "english", "cs"])) {
      errors.subject = "Provided event subject is invalid";
    }
  }

  return { errors, isValid: isEmpty(errors), isType: false };
};

module.exports = {
  validateCreateEventInput,
  validateUpdateEventInput
};
