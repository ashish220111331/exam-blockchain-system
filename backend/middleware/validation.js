const validation = `
const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      }),
    name: Joi.string().min(2).max(100).required(),
    userType: Joi.string().valid('examiner', 'center').required(),
    centerId: Joi.when('userType', {
      is: 'center',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    userType: Joi.string().valid('examiner', 'center').required()
  }),

  uploadFile: Joi.object({
    examDate: Joi.date().min('now').required(),
    examTime: Joi.string().pattern(/^([01]\\d|2[0-3]):([0-5]\\d)$/).required()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
  })
};

module.exports = {
  validateRequest,
  schemas
};
`;