import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import ms from 'ms';
import { BootstrapModule } from './bootstrap.module';

const logger = new Logger('main');

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(
    BootstrapModule,
    { cors: true, rawBody: true },
  );

  app.useBodyParser('json', { limit: '100mb' });
  app.useBodyParser('urlencoded', { limit: '100mb', extended: true });
  app.enable('trust proxy');
  app.enableShutdownHooks();

  const server = await app.listen(3000, () =>
    logger.warn(`server is listening at ${3000}`),
  );
  server.keepAliveTimeout = ms('60s');
}

bootstrap().catch((e) => {
  logger.error('bootstrap fatal error:', e.message);
});
