import { WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import _ from 'lodash';

const JobMapKey = 'bullmq:jobs';

export function Process(): MethodDecorator;
export function Process(name: string): MethodDecorator;
export function Process(options: { name: string }): MethodDecorator;
export function Process(options?: string | { name: string }): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const map = Reflect.getMetadata(JobMapKey, target) ?? {};
    map[
      options ? (_.isString(options) ? options : options.name) : '__default__'
    ] = propertyKey;
    Reflect.defineMetadata(JobMapKey, map, target);
  };
}

export abstract class BaseProcessor extends WorkerHost {
  protected abstract logger: Logger;

  constructor() {
    super();
    const pass =
      this.process.toString() === BaseProcessor.prototype.process.toString();
    if (!pass) {
      throw new Error(
        `${this.constructor.name}.process() must not be overridden`,
      );
    }
  }

  async process(job: Job, token?: string) {
    try {
      const map = Reflect.getMetadata(JobMapKey, this) ?? {};
      return await this[map[job.name]]?.(job, token);
    } catch (e) {
      this.logger.error(`BaseProcessor error`, e);
      throw e;
    }
  }
}

export abstract class BaseRepeatProcessor
  extends BaseProcessor
  implements OnModuleInit
{
  protected abstract queue: Queue;
  protected abstract logger: Logger;

  async onModuleInit() {
    const { enabled, cron, name = this.queue.name } = this.loadConfig();

    const jobs = await this.queue.getRepeatableJobs();
    for (const job of jobs) {
      this.logger.debug(`remove schedule: ${job.key}`);
      await this.queue.removeRepeatableByKey(job.key);
    }

    const notDefineDefaultJob = _.chain(
      Reflect.getMetadata(JobMapKey, this) as Record<string, string>,
    )
      .entries()
      .find(([k, v]) => k === '__default__')
      .isEmpty()
      .value();

    if (notDefineDefaultJob) {
      throw new Error(
        'You must define a default job for the processor, use @Process() decorator',
      );
    }

    if (enabled) {
      this.logger.log(`set schedule: ${name}, cron: ${cron}`);
      await this.queue.add('__default__', {}, { repeat: { pattern: cron } });
    }
  }

  protected abstract loadConfig(): {
    name?: string;
    enabled: boolean;
    cron: string;
  };
}
