import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Transactional } from 'typeorm-transactional';
import { CreatorOrder } from './creator-order.entity';

const logger = new Logger('UpdateOrderProcessor');

@Processor('update-order-queue')
export class UpdateOrderProcessor extends WorkerHost {
  @Transactional()
  async process(job: Job, token?: string): Promise<any> {
    switch (job.name) {
      case 'update-creator-order':
        return this.updateOrder(job.data.orderId);
    }
  }

  @Transactional()
  private async updateOrder(orderId: number) {
    logger.log(`Updating creator order ${orderId}`);

    const creatorOrder = await CreatorOrder.findOne({
      where: { id: orderId },
    });

    if (!creatorOrder) {
      logger.warn(`Creator order ${orderId} not found`);
      return null;
    }

    creatorOrder.field2 = 'test111';
    await creatorOrder.save();

    logger.log(`Updated creator order ${orderId}`);
    return creatorOrder;
  }
}
