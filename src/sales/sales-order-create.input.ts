import {
  IsAscii,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { SalesOrderPlatformType } from './sales-order-platform-type.enum';

export class SalesOrderCreateInput {
  @IsEnum(SalesOrderPlatformType)
  platformType: SalesOrderPlatformType;

  @IsOptional()
  @IsNotEmpty()
  @IsAscii()
  @MaxLength(36)
  storeId: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(64)
  referenceId: string;

  @IsNotEmpty()
  @MaxLength(64)
  name: string;
}
