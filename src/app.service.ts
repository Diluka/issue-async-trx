import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Transactional } from 'typeorm-transactional';
import { Order } from './order.entity';

const logger = new Logger('AppService');

@Injectable()
export class AppService {
  @OnEvent('order.created')
  @Transactional()
  async handleOrderCreated(order: Order) {
    // await Record.update(record.id, { field2: os.hostname() });
  }

  async handleCreatorOrderCreated(order: Order) {
    // await Record.update(record.id, { field2: os.hostname() });
  }
}
