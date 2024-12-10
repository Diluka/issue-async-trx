import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as process from 'node:process';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { AppController } from './app.controller';
import { AppProcessor } from './app.processor';
import { AppService } from './app.service';
import { CommonService } from './common.service';
import { Record } from './record.entity';
import { TypeORMLogger } from './typeorm-logger';

initializeTransactionalContext();

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        username: 'root',
        password: 'root',
        database: 'test',
        entityPrefix: 'tmp_',
        synchronize: true,
        logging: true,
        logger: new TypeORMLogger(true),
        autoLoadEntities: true,
      }),
      async dataSourceFactory(options) {
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    TypeOrmModule.forFeature([Record]),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
      },
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
    BullModule.registerQueue({ name: 'test-app' }),
  ],
  controllers: [AppController],
  providers: [AppService, AppProcessor, CommonService],
})
export class AppModule {}
