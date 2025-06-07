import { createClient } from 'redis';

// Get Redis URL from environment, with better logging
const redisUrl = process.env.REDIS_URL;
console.log('Redis URL configured:', redisUrl ? 'Yes' : 'No (using localhost)');
console.log('Attempting Redis connection...');

// Create Redis client with better error handling
const redisClient = createClient({
  url: redisUrl || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      const maxRetries = 5;
      if (retries > maxRetries) {
        console.error(`Max Redis reconnection attempts (${maxRetries}) reached. Continuing without Redis.`);
        return false; // Stop retrying
      }
      const delay = Math.min(retries * 500, 3000);
      console.log(`Redis reconnection attempt ${retries}, waiting ${delay}ms`);
      return delay;
    },
    connectTimeout: 5000, // 5 seconds
  }
});

// Handle Redis events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
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

redisClient.on('end', () => {
  console.log('Redis Client Connection Ended');
});

// Connect to Redis with fallback
const redisReady = redisClient.connect()
  .then(() => {
    console.log('Redis connection successful');
    return true;
  })
  .catch(err => {
    console.error('Redis connection failed:', err.message);
    console.log('Continuing without Redis...');
    return false;
  });

export { redisReady };
export default redisClient; 