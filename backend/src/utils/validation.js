const joi = require('joi');

const validateEmail = joi
  .string()
  .email({ minDomainSegments: 2 })
  .lowercase()
  .required();

const validatePassword = joi
  .string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .message('Password must contain at least 1 uppercase, 1 lowercase, 1 number, 1 special character');

// Auth Validation Schemas
const authSchemas = {
  register: joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    email: validateEmail,
    password: validatePassword,
    confirmPassword: joi.string().valid(joi.ref('password')).required(),
  }),

  login: joi.object({
    email: validateEmail,
    password: joi.string().required(),
  }),
};

// Chat Validation Schemas
const chatSchemas = {
  sendMessage: joi.object({
    receiverId: joi.string().required(),
    message: joi.string().trim().min(1).max(5000).required(),
  }),

  createConversation: joi.object({
    participantId: joi.string().required(),
  }),
};

// Photo Validation Schemas
const photoSchemas = {
  createAlbum: joi.object({
    name: joi.string().trim().min(1).max(100).required(),
    description: joi.string().max(500),
  }),

  uploadPhoto: joi.object({
    albumId: joi.string().required(),
    title: joi.string().max(100),
  }),
};

// Finder Validation Schemas
const finderSchemas = {
  createFile: joi.object({
    name: joi.string().trim().min(1).max(255).required(),
    type: joi.string().valid('file', 'folder').required(),
    content: joi.string().optional(),
  }),

  renameFile: joi.object({
    newName: joi.string().trim().min(1).max(255).required(),
  }),
};

// Utility function to validate request body
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  authSchemas,
  chatSchemas,
  photoSchemas,
  finderSchemas,
  validate,
};
