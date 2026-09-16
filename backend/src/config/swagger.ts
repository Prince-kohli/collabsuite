import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollabSuite SaaS Platform API Documentation',
      version: '1.0.0',
      description: 'RESTful API documentation for CollabSuite unified productivity workspace.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide JWT Access Token in format: Bearer <token>'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);