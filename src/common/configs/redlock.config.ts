import { RedlockModuleOptions } from '@anchan828/nest-redlock';
import { registerAs } from '@nestjs/config';
import Redis from 'ioredis';
import ms from 'ms';

export default registerAs('redlock', () => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = +process.env.REDIS_PORT || 6379;
  const keyPrefix = '{v2-redlock}:';

  const client = new Redis({ host, port, keyPrefix });

  return {
    clients: [client],
    settings: {
      driftFactor: 0.01,
      retryCount: -1,
      retryDelay: 1000,
      retryJitter: 200,
    },
    duration: ms('10 seconds'),
  } as RedlockModuleOptions;
});
