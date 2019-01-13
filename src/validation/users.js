const Validator = require("validator");
const { isEmpty, typeCheck } = require("./utils");

validateRegisterInput = data => {
  let errors = {};

  const typeMap = {
    username: "string",
    email: "string",
    password: "string"
  };

  const { typeErrors, isValid } = typeCheck(data, typeMap);
  if (!isValid) {
    return { errors: typeErrors, isValid, isType: true };
  }

  if (!Validator.isLength(data.username, { min: 2, max: 30 })) {
    errors.username = "Username must be between 2 and 30 characters";
  }

  if (Validator.isEmpty(data.username)) {
    errors.username = "Username field is required";
  }

  if (!Validator.matches(data.username, /^[a-zA-Z0-9_]*$/)) {
    errors.username =
      "Username must not contain characters other than alphanumeric or underscores";
  }

  if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }

  if (!Validator.isLength(data.password, { min: 6 })) {
    errors.password = "Password must be at least 6 characters";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

validateLoginInput = data => {
  let errors = {};

  const typeMap = {
    email: "string",
    password: "string"
  };

  const { typeErrors, isValid } = typeCheck(data, typeMap);
  if (!isValid) {
    return { errors: typeErrors, isValid, isType: true };
  }

  if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
    isType: false
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
