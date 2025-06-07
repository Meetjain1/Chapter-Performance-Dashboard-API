import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Connecting to Redis at:', redisUrl.replace(/\/\/.*@/, '//')); // Log URL without credentials

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      const maxRetries = 20;
      if (retries > maxRetries) {
        console.error(`Max Redis reconnection attempts (${maxRetries}) reached`);
        return new Error('Max Redis reconnection attempts reached');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis reconnection attempt ${retries}, waiting ${delay}ms`);
      return delay;
    },
    connectTimeout: 10000, // 10 seconds
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  // Don't crash the app on Redis errors
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

redisClient.on('reconnecting', () => {
  console.log('Redis Client Reconnecting...');
});

// Connect to Redis
const redisReady = redisClient.connect().catch(err => {
  console.error('Failed to connect to Redis:', err);
  // Don't throw error, let the app continue without Redis
  return Promise.resolve();
});

export { redisReady };
export default redisClient; 