import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '@songkeys/nestjs-redis';
import _ from 'lodash';
import moment from 'moment';

@Injectable()
export class CommonService {
  @Log() private logger: Logger;

  private static emitter: EventEmitter2;

  constructor(
    private redis: RedisService,
    eventEmitter: EventEmitter2,
  ) {
    CommonService.emitter = eventEmitter;
  }

  /**
   * 生成序列号
   * @param scope
   * @param prefix
   * @param suffix
   */
  async generateSN(scope: string, prefix = '', suffix = '') {
    const now = moment();
    const date = now.format('YYYYMMDD');
    const seconds = _.padStart(
      now.diff(now.clone().startOf('d'), 'second') + '',
      5,
      '0',
    );
    const key = `SN:${scope}`;
    const sKey = `${key}:${seconds}`;
    const rc = this.redis.getClient();
    const [[, num], [, sNum]] = await rc
      .multi()
      .incr(key)
      .incr(sKey)
      .pexpireat(key, moment().endOf('day').valueOf())
      .expire(sKey, 1)
      .exec();
    const sn = _.padStart(String(+num % 100), 2, '0');
    const snInSeconds = Math.floor(+sNum / 100) || '';
    return `${prefix}${date}${seconds}${sn}${snInSeconds}${suffix}`;
  }

  static emit(event: string, ...values: any[]) {
    if (this.emitter) {
      Logger.debug(`emit event ${event}`, 'CommonService.emit');
      return this.emitter.emit(event, ...values);
    }
  }

  static async emitAsync(event: string, ...values: any[]) {
    if (this.emitter) {
      Logger.debug(`emit event ${event}`, 'CommonService.emitAsync');
      return this.emitter.emitAsync(event, ...values);
    }
  }
}
