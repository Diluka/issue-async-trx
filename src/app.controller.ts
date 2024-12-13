import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Delete, Get, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SalesCreatorOrder } from './sales/sales-creator-order.entity';
import { SalesOrder } from './sales/sales-order.entity';

const logger = new Logger('AppController');

@Controller()
export class AppController {
  constructor(@InjectQueue('v2-store-shopify-webhook') private queue: Queue) {}

  @Get()
  async checkQueue() {
    const activeCount = await this.queue.getActiveCount();
    return { activeCount };
  }

  @Get('results')
  async getResults() {
    return SalesCreatorOrder.find();
  }

  @Delete('clean-all')
  async cleanAll() {
    await SalesOrder.delete({});
  }
}
