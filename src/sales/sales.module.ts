import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesCreatorOrder } from './sales-creator-order.entity';
import { SalesCreatorOrderService } from './sales-creator-order.service';
import { SalesOrderLineItem } from './sales-order-line-item.entity';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderService } from './sales-order.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderLineItem,
      SalesCreatorOrder,
    ]),
  ],
  providers: [SalesOrderService, SalesCreatorOrderService],
  exports: [SalesOrderService],
})
export class SalesModule {}
