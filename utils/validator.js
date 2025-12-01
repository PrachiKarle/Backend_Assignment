const Joi = require("joi");

exports.validateSKU = (sku) => {
  const schema = Joi.string().alphanum().min(3).max(20).required();
  return schema.validate(sku);
};
