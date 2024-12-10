import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { setTimeout } from 'node:timers/promises';
import { Transactional } from 'typeorm-transactional';
import { EmitEvent } from './emit-event.decorator';
import { Record } from './record.entity';
import { Order } from './order.entity';

const logger = new Logger('AppProcessor');

@Processor('test-app')
export class AppProcessor extends WorkerHost {
  @Transactional()
  async process(job: Job, token?: string): Promise<any> {
    logger.log(`Processing job ${job.id}`);
    const record = await Record.create({ field1: job.id }).save();
    await this.createOrder(record.id);
    await setTimeout(20);
    return record;
  }

  @EmitEvent('order.created')
  @Transactional()
  private async createOrder(recordId: number) {
    return await Order.create({ field1: String(recordId) }).save();
  }

  @OnWorkerEvent('completed')
  async onQueueCompleted(job: Job, result: any) {
    const recordId = result?.id;
    if (recordId) {
      await Record.update({ id: recordId }, { status: 'completed' });
    }
  }
}
