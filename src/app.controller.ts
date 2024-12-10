import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, Delete, Get, Logger, Post } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Record } from './record.entity';

const logger = new Logger('AppController');

@Controller()
export class AppController {
  constructor(@InjectQueue('test-app') private queue: Queue) {}

  @Post('add-job')
  async addJob(@Body('i') i: number) {
    const job = await this.queue.add('create-creator-order', { i });
    logger.log(`Job added: ${job.id}, i: ${i}`);
  }

  @Post('add-update-job')
  async addUpdateJob(@Body('i') i: number) {
    const job = await this.queue.add('update-creator-order', { i });
    logger.log(`Job added: ${job.id}, i: ${i}`);
  }

  @Get()
  async checkQueue() {
    const activeCount = await this.queue.getActiveCount();
    return { activeCount };
  }

  @Get('results')
  async getResults() {
    return Record.find();
  }

  @Delete('clean-all')
  async cleanAll() {
    await Record.delete({});
  }
}
