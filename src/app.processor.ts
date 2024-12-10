import { InjectQueue } from '@nestjs/bullmq';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { setTimeout } from 'node:timers/promises';
import { Transactional } from 'typeorm-transactional';
import { EmitEvent } from './emit-event.decorator';
import { Record } from './record.entity';
import { Order } from './order.entity';
import { CreatorOrder } from './creator-order.entity';

const logger = new Logger('AppProcessor');

@Processor('test-app')
export class AppProcessor extends WorkerHost {
  constructor(
    @InjectQueue('update-order-queue') private updateOrderQueue: Queue,
  ) {
    super();
  }

  @Transactional()
  async process(job: Job, token?: string): Promise<any> {
    switch (job.name) {
      case 'create-creator-order':
        await this.createOrder(job.data);
      case 'update-creator-order':
        await this.updateOrder(job.data);
    }
    return job.data;
  }

  @EmitEvent('order.updated')
  private async updateOrder(id: number) {
    const order = await Order.findOne({
      where: { recordId: id },
    });

    order.field2 = 'test111';
    await order.save();

    return await CreatorOrder.findOne({
      where: { orderId: order.id },
    });
  }

  @Transactional()
  private async createOrder(recordId: number) {
    const order = await Order.create({ recordId }).save();
    return await CreatorOrder.create({ orderId: order.id }).save();
  }

  @OnWorkerEvent('completed')
  async onQueueCompleted(job: Job, result: any) {
    const recordId = result?.id;
    if (recordId) {
      await Record.update({ id: recordId }, { status: 'completed' });
    }
  }
}
