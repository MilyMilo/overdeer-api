const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === "object" && Object.keys(value).length === 0) ||
  (typeof value === "string" && value.trim().length === 0);

// typeCheck compares types of values from the first object to the definitions
// marked with THE SAME keys in the second object
// It returns errors object and isValid boolean if an error occurred
const typeCheck = (values, typeMap) => {
  let typeErrors = {};

  for (const key in typeMap) {
    // if type mapping ends with ? (meaning that it's optional)
    // and the value is undefined (omitted) then don't rise an error
    // do so however if the type is anything else
    const isOptional = typeMap[key].substr(-1) === "?";
    type = isOptional ? typeMap[key].slice(0, -1) : typeMap[key];

    if (typeof values[key] !== type) {
      // DEBUG:
      // console.log(key, values[key], typeMap[key], typeof values[key]);

      // If the typeMap indicates that the value should be an array,
      // typeof will fail since it's an 'object' - check for this case
      if (type === "array" && Array.isArray(values[key])) {
        break;
      }

      const omit = isOptional && typeof values[key] === "undefined";
      if (omit) {
      } else {
        typeErrors[key] = `${capitalize(key)} has to be of type ${type}`;
      }
    }
  }

  return { typeErrors, isValid: isEmpty(typeErrors) };
};

const capitalize = string => {
  return string[0].toUpperCase() + string.slice(1);
};

module.exports = { isEmpty, typeCheck, capitalize };
