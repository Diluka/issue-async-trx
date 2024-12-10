import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as os from 'node:os';
import { Transactional } from 'typeorm-transactional';
import { Record } from './record.entity';

const logger = new Logger('AppService');

@Injectable()
export class AppService {
  @OnEvent('completed')
  @Transactional()
  async onCompleted(record: Record) {
    logger.log(`Record ${record.id} completed`);
    await Record.update(record.id, { field2: os.hostname() });
  }
}
