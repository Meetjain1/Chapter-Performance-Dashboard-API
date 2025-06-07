import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swaggerConfig';

import chapterRoutes from './routes/chapterRoutes';
import authRoutes from './routes/authRoutes';
import { redisReady } from './services/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware
app.use(morgan('dev'));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS setup
app.use(cors());

// Basic security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// API documentation
app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chapters', chapterRoutes);
console.log('Chapters route registered at /api/v1/chapters');

// Error handlers
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
(async () => {
  try {
    await redisReady;
    console.log('Redis is ready');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chapter-performance');
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
})(); 