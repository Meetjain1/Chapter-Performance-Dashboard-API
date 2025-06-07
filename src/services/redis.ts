import Redis from 'ioredis';
import config from '../config/config';

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (error) => {
  console.error('Redis Error:', error);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export const redisReady = new Promise((resolve, reject) => {
  redis.on('ready', resolve);
  redis.on('error', reject);
});

export default redis; 