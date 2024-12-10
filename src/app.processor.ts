import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { setTimeout } from 'node:timers/promises';
import { Transactional } from 'typeorm-transactional';
import { EmitEvent } from './emit-event.decorator';
import { Record } from './record.entity';

const logger = new Logger('AppProcessor');

@Processor('test-app')
export class AppProcessor extends WorkerHost {
  @EmitEvent('completed')
  @Transactional()
  async process(job: Job, token?: string): Promise<any> {
    logger.log(`Processing job ${job.id}`);
    const record = await this.createRecord(job);
    // await setTimeout(200);
    return record;
  }

  @Transactional()
  private async createRecord(job: Job) {
    return await Record.create({ field1: job.id }).save();
  }
}
