import { createClient } from 'redis';

// Get Redis URL from environment
const redisUrl = process.env.REDIS_URL;
console.log('Redis URL configured:', redisUrl ? 'Yes' : 'No (using memory store)');

// Create Redis client only if URL is provided
const redisClient = redisUrl ? createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      const maxRetries = 5;
      if (retries > maxRetries) {
        console.error(`Max Redis reconnection attempts (${maxRetries}) reached. Using memory store.`);
        return false; // Stop retrying
      }
      const delay = Math.min(retries * 500, 3000);
      console.log(`Redis reconnection attempt ${retries}, waiting ${delay}ms`);
      return delay;
    },
    connectTimeout: 5000, // 5 seconds
  }
}) : null;

// Handle Redis events if client exists
if (redisClient) {
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
}

// Connect to Redis with fallback
const redisReady = !redisClient ? Promise.resolve(false) : redisClient.connect()
  .then(() => {
    console.log('Redis connection successful');
    return true;
  })
  .catch(err => {
    console.error('Redis connection failed:', err.message);
    console.log('Using memory store...');
    return false;
  });

export { redisReady };
export default redisClient; 