import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Transactional } from 'typeorm-transactional';
import { Order } from './order.entity';
import { CreatorOrder } from './creator-order.entity';
import { create } from 'domain';

const logger = new Logger('AppService');

@Injectable()
export class AppService {
  @OnEvent('order.updated')
  @Transactional()
  async handleCreatorOrderUpdated(createOrder: CreatorOrder) {
    logger.log(`Creator order updated: ${createOrder.id}`);
    await this.fulfillSalesCreatorOrder(createOrder.id);
  }

  async fulfillSalesCreatorOrder(createOrderId: number) {
    const creatorOrder = await CreatorOrder.findOne({
      where: { id: createOrderId },
    });

    creatorOrder.field1 = 'test';
    return creatorOrder.save();
  }
}
