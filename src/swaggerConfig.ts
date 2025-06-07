import swaggerJSDoc from 'swagger-jsdoc';

const isProduction = process.env.NODE_ENV === 'production';
const serverUrl = isProduction 
  ? 'https://chapter-performance-dashboard-api.onrender.com' 
  : 'http://localhost:3000';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Chapter Performance API',
      version: '1.0.0',
      description: 'API documentation for the Chapter Performance Dashboard, providing endpoints for managing and retrieving chapter data with admin authentication.',
    },
    servers: [
      {
        url: serverUrl,
        description: isProduction ? 'Production Server' : 'Development Server'
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
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions); 