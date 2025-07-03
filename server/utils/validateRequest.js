// utils/validateRequest.js
const formatJoiErrors = (error) => {
  const formattedErrors = {};
  if (error?.details) {
    error.details.forEach((err) => {
      const key = err.context?.key;
      if (key && !formattedErrors[key]) {
        formattedErrors[key] = err.message;
      }
    });
  }
  return formattedErrors;
};

const validateRequest = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    return { isValid: false, errors: formatJoiErrors(error) };
  }
  return { isValid: true, value };
};

module.exports = {
  validateRequest,
};
