import { createClient } from 'redis';
import { promisify } from 'util';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Ensure the client is connected before use
export const redisReady = redisClient.connect();

// Promisify Redis commands
export const getAsync = promisify(redisClient.get).bind(redisClient);
export const setAsync = promisify(redisClient.set).bind(redisClient);
export const delAsync = promisify(redisClient.del).bind(redisClient);
export const keysAsync = promisify(redisClient.keys).bind(redisClient);

// Cache duration in seconds (1 hour)
export const CACHE_DURATION = 3600;

export default redisClient; 