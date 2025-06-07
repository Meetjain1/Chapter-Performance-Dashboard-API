import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        console.error('Max Redis reconnection attempts reached');
        return new Error('Max Redis reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  // Don't crash the app on Redis errors
});

redisClient.on('connect', () => console.log('Redis Client Connected'));

redisClient.on('reconnecting', () => console.log('Redis Client Reconnecting...'));

// Ensure the client is connected before use
export const redisReady = (async () => {
  try {
    await redisClient.connect();
    console.log('Redis connection established');
  } catch (error) {
    console.error('Redis connection failed:', error);
    // Don't crash the app if Redis is not available
  }
})();

export const getAsync = async (key: string) => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

export const setAsync = async (key: string, value: string, ttl?: number) => {
  try {
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

export const delAsync = async (key: string) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis del error:', error);
    return false;
  }
};

export const keysAsync = async (pattern: string) => {
  try {
    return await redisClient.keys(pattern);
  } catch (error) {
    console.error('Redis keys error:', error);
    return [];
  }
};

// Cache duration in seconds (1 hour)
export const CACHE_DURATION = 3600;

export default redisClient; 