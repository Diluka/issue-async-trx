/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

import { randomUUID } from 'crypto';
import _ from 'lodash';
import moment, { MomentInput, unitOfTime } from 'moment';
import ms from 'ms';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MyUtil {
  export function uuid() {
    return randomUUID();
  }

  /**
   * sleep async
   * @param time milliseconds or human-readable time string
   */
  export async function sleep(time: number | string) {
    return new Promise<void>((resolve) =>
      setTimeout(() => resolve(), _.isString(time) ? ms(time) : time),
    );
  }

  /**
   * check if inp is expired.
   * if inp is null then it's never expired
   * @param inp
   * @param granularity
   */
  export function isExpired(
    inp: MomentInput,
    granularity?: unitOfTime.StartOf,
  ) {
    return inp && moment().isAfter(inp, granularity);
  }

  /**
   * copy all metadata from source to target
   * @param source
   * @param target
   */
  export function copyMetadata(source: any, target: any) {
    const metadataKeys = Reflect.getMetadataKeys(source);
    for (const metadataKey of metadataKeys) {
      Reflect.defineMetadata(
        metadataKey,
        Reflect.getMetadata(metadataKey, source),
        target,
      );
    }
  }

  export function delObjectKey<T>(
    obj: T,
    predicate?: (v: any, k: string | symbol) => boolean,
  ): T {
    if (_.isPlainObject(obj)) {
      for (const k of [
        ...Object.keys(obj),
        ...Object.getOwnPropertySymbols(obj),
      ]) {
        if (predicate && predicate(obj[k], k)) delete obj[k];
      }
    }

    return obj;
  }

  // delete key that the value is 'undefined'
  export function delUndefinedKey<T>(obj: T): T {
    return delObjectKey(obj, (v) => _.isUndefined(v));
  }

  // delete key that the value is 'null'
  export function delNullKey<T>(obj: T): T {
    return delObjectKey(obj, (v) => _.isNull(v));
  }

  // delete key that the value is 'null' or 'undefined'
  export function delNilKey<T>(obj: T): T {
    return delObjectKey(obj, (v) => _.isNil(v));
  }

  /**
   * aop decorator
   * @param fn if return `undefined`, then use original result
   */
  export function aop<T>(fn: (result: T) => any) {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>,
    ) {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        const result = await originalMethod.apply(this, args);
        const modifiedResult = await fn(result);
        return modifiedResult === undefined ? result : modifiedResult;
      };
      copyMetadata(originalMethod, descriptor.value);
      return descriptor;
    };
  }
}
