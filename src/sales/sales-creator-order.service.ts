import { MyUtil } from '@app/shared';
import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import _ from 'lodash';
import { Transactional } from 'typeorm-transactional';
import { CommonService } from '../common';
import { SalesCreatorOrder } from './sales-creator-order.entity';
import { SalesOrderFulfillmentStatus } from './sales-order-fulfillment-status.enum';
import { SalesOrderLineItem } from './sales-order-line-item.entity';
import { SalesOrderPlatformType } from './sales-order-platform-type.enum';
import { SalesOrder } from './sales-order.entity';

@Injectable()
export class SalesCreatorOrderService {
  @Log() private logger: Logger;

  @OnEvent('sales-order.created', { async: true })
  @OnEvent('sales-order.updated', { async: true })
  async recreateFromSalesOrder(salesOrder: SalesOrder) {
    this.logger.log(
      'recreateFromSalesOrder',
      salesOrder.id,
      salesOrder.platformType,
    );
    switch (salesOrder.platformType) {
      case SalesOrderPlatformType.STORE_SHOPIFY:
        return await this.recreateForStoreShopify(salesOrder);
    }
  }

  @MyUtil.aop((salesCreatorOrders) => {
    for (const salesCreatorOrder of salesCreatorOrders) {
      CommonService.emit('sales-creator-order.fulfilled', salesCreatorOrder);
    }
  })
  async fulfillSalesCreatorOrder(salesOrderId: string) {
    this.logger.log(`fulfillSalesCreatorOrder ${salesOrderId}`);
    const salesCreatorOrders = await SalesCreatorOrder.find({
      where: { salesOrderId },
    });

    for (const salesCreatorOrder of salesCreatorOrders) {
      this.logger.log(
        `fulfillSalesCreatorOrder ${salesOrderId} ${salesCreatorOrder.id}`,
      );
      salesCreatorOrder.fulfillmentStatus =
        SalesOrderFulfillmentStatus.FULFILLED;
      salesCreatorOrder.fulfilledAt = new Date();
      await salesCreatorOrder.save();
    }
    return salesCreatorOrders;
  }

  @Transactional()
  @OnEvent('sales-order.fulfilled', { async: true })
  async handleSaleOrderFulfilled(salesOrder: SalesOrder) {
    this.logger.log(`handleSaleOrderFulfilled ${salesOrder.id}`);
    await this.fulfillSalesCreatorOrder(salesOrder.id);
  }

  /**
   * sale order belongs to single store
   * @param salesOrder
   * @private
   */
  @Transactional()
  private async recreateForStoreShopify(salesOrder: SalesOrder) {
    this.logger.debug('recreateForStoreShopify', salesOrder.id);
    let salesCreatorOrder = await SalesCreatorOrder.findOne({
      where: { salesOrderId: salesOrder.id, storeId: salesOrder.storeId },
    });
    if (!salesCreatorOrder) {
      salesCreatorOrder = SalesCreatorOrder.create({
        salesOrderId: salesOrder.id,
        storeId: salesOrder.storeId,
        name: salesOrder.name,
        sn: salesOrder.sn,
      });
    }

    // Object.assign(
    //   salesCreatorOrder,
    //   _.pick(salesOrder, [
    //     'totalPriceBp',
    //     'subtotalPriceBp',
    //     'totalTaxBp',
    //     'totalDiscountBp',
    //     'totalLineItemPriceBp',
    //     'totalLineItemDiscountBp',
    //   ]),
    // );

    await salesCreatorOrder.save();

    await SalesOrderLineItem.update(
      { salesOrderId: salesOrder.id },
      { salesCreatorOrderId: salesCreatorOrder.id },
    );

    return salesCreatorOrder;
  }
}
