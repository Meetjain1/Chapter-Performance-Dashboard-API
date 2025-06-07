import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swaggerConfig';
import config from './config/config';

import chapterRoutes from './routes/chapterRoutes';
import authRoutes from './routes/authRoutes';
import { redisReady } from './services/redis';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API routes
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/auth', authRoutes);

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
(async () => {
  try {
    // Wait for Redis to be ready
    await redisReady;
    console.log('Redis is ready');

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');

    // Start the server
    app.listen(config.port, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${config.port}`);
      console.log(`API Documentation: http://localhost:${config.port}/docs`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
})(); 