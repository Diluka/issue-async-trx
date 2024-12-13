import { RedlockModule } from '@anchan828/nest-redlock';
import { BullModule } from '@nestjs/bullmq';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@songkeys/nestjs-redis';
import _ from 'lodash';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { CommonService } from './common.service';
import bullmqConfig from './configs/bullmq.config';
import redisConfig from './configs/redis.config';
import redlockConfig from './configs/redlock.config';
import typeormConfig from './configs/typeorm.config';

initializeTransactionalContext();
const logger = new Logger('common');

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(bullmqConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(typeormConfig),
    ConfigModule.forFeature(redlockConfig),
    EventEmitterModule.forRoot({ global: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const opts = config.get('typeorm');

        logger.verbose('typeorm');
        logger.verbose(_.omit(opts, 'password'));

        return opts;
      },
      dataSourceFactory: async (options) =>
        addTransactionalDataSource(new DataSource(options)),
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config) => config.get('redis'),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config) => config.get('bullmq'),
    }),
    RedlockModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config) => config.get('redlock'),
    }),
  ],
  providers: [CommonService],
  exports: [CommonService, RedlockModule],
})
export class CommonModule {}
