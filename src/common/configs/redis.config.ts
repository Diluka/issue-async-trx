import { registerAs } from '@nestjs/config';
import { RedisModuleOptions } from '@songkeys/nestjs-redis';

export default registerAs('redis', () => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = +process.env.REDIS_PORT || 6379;
  const keyPrefix = '{v2-com}:';
  return { config: { host, port, keyPrefix } } as RedisModuleOptions;
});
