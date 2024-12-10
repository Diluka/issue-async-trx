import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommonService {
  private static emitter: EventEmitter2;

  constructor(eventEmitter: EventEmitter2) {
    CommonService.emitter = eventEmitter;
  }

  static emit(event: string, ...values: any[]) {
    if (this.emitter) {
      Logger.debug(`emit event ${event}`, 'CommonService.emit');
      return this.emitter.emit(event, ...values);
    }
  }
}
