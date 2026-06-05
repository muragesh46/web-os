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
const cleanValue = (value) => {
  if (typeof value === 'string') {
    return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (Array.isArray(value)) {
    return value.map(cleanValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleanObj = {};
    for (const key in value) {
      cleanObj[key] = cleanValue(value[key]);
    }
    return cleanObj;
  }
  return value;
};

const sanitizeXss = (req, res, next) => {
  const rawCode =
    req.path === '/api/code/execute' && req.body && typeof req.body.code === 'string'
      ? req.body.code
      : null;

  if (req.body) {
    req.body = cleanValue(req.body);
    if (rawCode !== null) {
      req.body.code = rawCode;
    }
  }
  if (req.query) {
    // In Express 5, req.query is getter-only. Mutate properties instead of reassigning the query object.
    for (const key in req.query) {
      req.query[key] = cleanValue(req.query[key]);
    }
  }
  if (req.params) {
    for (const key in req.params) {
      req.params[key] = cleanValue(req.params[key]);
    }
  }
  next();
};

// CSRF Token middleware
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

module.exports = {
  helmetConfig,
  sanitizeData,
  sanitizeXss,
  csrfProtection,
};
