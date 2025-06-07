import swaggerJsdoc from 'swagger-jsdoc';

const isProduction = process.env.NODE_ENV === 'production';

// Set the server URL based on the environment
const serverUrl = isProduction
  ? 'https://chapter-performance-dashboard-api.onrender.com'
  : 'http://localhost:3000';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chapter Performance Dashboard API',
      version: '1.0.0',
      description:
        'A RESTful API for managing chapter performance data with advanced features like caching, rate limiting, and admin authentication.',
    },
    servers: [
      {
        url: serverUrl,
        description: isProduction ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options); 