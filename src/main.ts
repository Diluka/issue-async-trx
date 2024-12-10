import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(logger);
  await app.listen(process.env.PORT ?? 3000, () =>
    logger.log('Server is running on port 3000'),
  );
}

bootstrap();
