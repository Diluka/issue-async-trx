import { registerAs } from '@nestjs/config';
import { QueueOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';

export default registerAs('bullmq', () => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = +process.env.REDIS_PORT || 6379;
  const db = +process.env.REDIS_DB || 0;

  const connection = {
    host,
    port,
    db,
    enableOfflineQueue: true,
  } as RedisOptions;

  return {
    prefix: '{bullmq}',
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
    },
  } as QueueOptions;
});
