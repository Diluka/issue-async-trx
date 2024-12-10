import { CommonService } from './common.service';

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

export function EmitEvent(event: string): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const originalMethod = descriptor.value as (...args: any[]) => any;
    descriptor.value = async function (...args) {
      try {
        const result = await originalMethod.apply(this, args);
        CommonService.emit(event, result);
        return result;
      } catch (e) {
        throw e;
      }
    };

    // restore metadata
    copyMetadata(originalMethod, descriptor.value);
  };
}
