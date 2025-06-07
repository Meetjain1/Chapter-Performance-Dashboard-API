interface Config {
  port: number;
  mongoUri: string;
  redisUrl: string;
  jwtSecret: string;
  adminEmail: string;
  adminPassword: string;
  corsOrigins: string[];
}

const development: Config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chapter-performance',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'd0041aa5cb1ce9ff77d37ac24c2916498d9a77350c475f2814ff73db7d20b3fb',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  corsOrigins: ['http://localhost:3000', 'http://localhost:5173']
};

const production: Config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  corsOrigins: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://chapter-performance-api.onrender.com'
  ]
};

const config: Config = process.env.NODE_ENV === 'production' ? production : development;

export default config; 