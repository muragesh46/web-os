const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Web OS API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for Web OS Backend',
      contact: {
        name: 'Support',
        email: 'support@webos.dev',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://api.webos.dev/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            sender: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/apps/*/routes.js', './src/routes/*.js'],
};

let cachedSpecs = null;
const getSpecs = () => {
  if (!cachedSpecs) {
    try {
      const swaggerJsdoc = require('swagger-jsdoc');
      cachedSpecs = swaggerJsdoc(options);
    } catch (err) {
      console.warn('Swagger doc generation fallback:', err.message);
      cachedSpecs = options.definition;
    }
  }
  return cachedSpecs;
};

const setupSwagger = (app) => {
  app.use('/api-docs', (req, res, next) => {
    const specs = getSpecs();
    swaggerUi.serve(req, res, () => {
      swaggerUi.setup(specs, { explorer: true })(req, res, next);
    });
  });
  console.log('📚 Swagger docs available at http://localhost:3001/api-docs');
};

module.exports = { setupSwagger, get specs() { return getSpecs(); } };
