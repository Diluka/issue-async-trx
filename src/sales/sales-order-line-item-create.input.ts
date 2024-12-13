import { IsInt, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SalesOrderLineItemCreateInput {
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(64)
  referenceId: string;

  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsNotEmpty()
  @MaxLength(64)
  sku: string;

  @IsInt()
  quantity: number;
}
