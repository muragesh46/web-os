const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Helmet - sets various HTTP headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Data sanitization against NoSQL injection (Express 5 compatible)
const sanitizeData = (req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.query) {
    mongoSanitize.sanitize(req.query);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }
  next();
};

// Data sanitization against XSS attacks (Express 5 compatible)
// Strips active script injection, iframes, and javascript: links without corrupting innocent text, code, or passwords
const SENSITIVE_FIELDS = new Set(['password', 'code', 'token', 'key', 'imageBase64']);

const cleanValue = (value, fieldName = '') => {
  if (SENSITIVE_FIELDS.has(fieldName)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/vbscript\s*:/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '');
  }
  if (Array.isArray(value)) {
    return value.map((v) => cleanValue(v, fieldName));
  }
  if (value !== null && typeof value === 'object') {
    const cleanObj = {};
    for (const key in value) {
      cleanObj[key] = cleanValue(value[key], key);
    }
    return cleanObj;
  }
  return value;
};

const sanitizeXss = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanValue(req.body);
  }
  if (req.query) {
    for (const key in req.query) {
      req.query[key] = cleanValue(req.query[key], key);
    }
  }
  if (req.params) {
    for (const key in req.params) {
      req.params[key] = cleanValue(req.params[key], key);
    }
  }
  next();
};

module.exports = {
  helmetConfig,
  sanitizeData,
  sanitizeXss,
};
