import { MyUtil } from '@app/shared';
import { Log } from '@nest-mods/log';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import _ from 'lodash';
import moment from 'moment';
import { Transactional } from 'typeorm-transactional';
import { CommonService, EmitEvent } from '../common';
import { SalesOrderCreateInput } from './sales-order-create.input';
import { SalesOrderFulfillmentStatus } from './sales-order-fulfillment-status.enum';
import { SalesOrderLineItemCreateInput } from './sales-order-line-item-create.input';
import { SalesOrderLineItem } from './sales-order-line-item.entity';
import { SalesOrderPlatformType } from './sales-order-platform-type.enum';
import { SalesOrder, SalesOrderMeta } from './sales-order.entity';

@Injectable()
export class SalesOrderService {
  @Log() private logger: Logger;

  constructor(private commonService: CommonService) {}

  async saveOne(
    inOrder: SalesOrderCreateInput,
    inLineItems: SalesOrderLineItemCreateInput[],
    meta?: SalesOrderMeta,
  ) {
    await validateOrReject(inOrder);
    for (const it of inLineItems) {
      await validateOrReject(it);
    }
    meta = _.defaults(meta, {});

    const { platformType, storeId, referenceId } = inOrder;
    const order = await SalesOrder.findOne({
      where: { platformType, storeId, referenceId },
      select: ['id', 'meta'],
    });

    this.logger.debug(
      `platformType: ${platformType}, storeId: ${storeId}, referenceId: ${referenceId}, salesOrderId: ${order?.id}`,
    );

    if (order) {
      const needUpdate = this.validateIfNeedUpdate(order, meta);
      if (needUpdate) {
        return this.updateOne(order.id, inOrder, inLineItems, meta);
      } else {
        return SalesOrder.findOne({
          where: { id: order.id },
          relations: { items: true },
        });
      }
    } else {
      return this.createOne(inOrder, inLineItems, meta);
    }
  }

  @EmitEvent('sales-order.created')
  @Transactional()
  private async createOne(
    inOrder: SalesOrderCreateInput,
    inLineItems: SalesOrderLineItemCreateInput[],
    meta: SalesOrderMeta,
  ) {
    const order = await SalesOrder.create({
      sn: await this.generateOrderSN(),
      ...inOrder,
      meta,
    }).save();
    order.items = [];

    for (const it of inLineItems) {
      order.items.push(
        await SalesOrderLineItem.create({
          ...it,
          salesOrderId: order.id,
        }).save(),
      );
    }

    return order;
  }

  @EmitEvent('sales-order.updated')
  @Transactional()
  private async updateOne(
    id: string,
    inOrder: SalesOrderCreateInput,
    inLineItems: SalesOrderLineItemCreateInput[],
    meta: SalesOrderMeta,
  ) {
    const order = await SalesOrder.findOneOrFail({
      where: { id },
      relations: { items: true },
      lock: { mode: 'pessimistic_write' },
    });

    meta = Object.assign(order.meta, meta);

    const lineItems: SalesOrderLineItem[] = [];
    for (const it of inLineItems) {
      let lineItem = _.find(order.items, { referenceId: it.referenceId });

      if (lineItem) {
        Object.assign(lineItem, it);
      } else {
        lineItem = SalesOrderLineItem.create({
          ...it,
          salesOrderId: order.id,
        });
      }

      await lineItem.save();
      lineItems.push(lineItem);
    }

    const deletedItems = _.differenceBy(
      order.items,
      lineItems,
      (o) => o.referenceId,
    );

    for (const it of deletedItems) {
      await it.remove();
    }

    order.items = lineItems;
    order.meta = meta;
    Object.assign(order, inOrder);
    await order.save();

    return order;
  }

  @MyUtil.aop((order) => {
    Logger.log(
      `Order ID: ${order.id}, Fulfillment Status: ${order.fulfillmentStatus}`,
      'app.SalesOrderService.fulfilledOne',
    );
    switch (order.fulfillmentStatus) {
      case SalesOrderFulfillmentStatus.FULFILLED:
        CommonService.emit('sales-order.fulfilled', order);
        break;
      case SalesOrderFulfillmentStatus.PARTIAL:
        CommonService.emit('sales-order.partial-fulfilled', order);
        break;
    }
  })
  @Transactional()
  async fulfilledOne(
    id: string,
    inLineItems?: { id: string; quantity: number }[],
  ) {
    const order = await SalesOrder.findOneOrFail({
      where: { id },
      relations: { items: true },
      lock: { mode: 'pessimistic_write' },
    });

    if (order.isCanceled) {
      throw new BadRequestException(
        `The order(${order.name}) has been canceled`,
      );
    }
    if (order.fulfillmentStatus === SalesOrderFulfillmentStatus.FULFILLED) {
      throw new BadRequestException(
        `The order(${order.name}) has been fulfilled`,
      );
    }

    if (_.isEmpty(inLineItems)) {
      inLineItems = _.chain(order.items)
        .filter(
          (it) =>
            it.fulfillmentStatus !== SalesOrderFulfillmentStatus.FULFILLED,
        )
        .map((it) => ({
          id: it.id,
          quantity: it.quantity - it.fulfilledQuantity,
        }))
        .value();
    }

    for (const inItem of inLineItems) {
      const item = _.find(order.items, (it) => it.id === inItem.id);
      if (!item) continue;

      const fulfillableQuantity = item.quantity - item.fulfilledQuantity;
      if (inItem.quantity > fulfillableQuantity) {
        throw new BadRequestException(
          `The order(${order.name})-item(${item.name} quantity(${inItem.quantity}) more than fulfillableQuantity(${fulfillableQuantity})`,
        );
      }
      item.fulfilledQuantity += inItem.quantity;
      item.fulfilledAt = new Date();
      item.fulfillmentStatus =
        item.fulfilledQuantity === item.quantity
          ? SalesOrderFulfillmentStatus.FULFILLED
          : SalesOrderFulfillmentStatus.PARTIAL;
      await item.save();
    }

    const isAllFulfilled = _.every(
      order.items,
      (it) => it.fulfillmentStatus === SalesOrderFulfillmentStatus.FULFILLED,
    );
    const isAllUnfulfilled = _.every(
      order.items,
      (it) => it.fulfillmentStatus === SalesOrderFulfillmentStatus.NONE,
    );
    order.fulfillmentStatus = isAllFulfilled
      ? SalesOrderFulfillmentStatus.FULFILLED
      : isAllUnfulfilled
        ? SalesOrderFulfillmentStatus.NONE
        : SalesOrderFulfillmentStatus.PARTIAL;
    order.fulfilledAt = new Date();
    return await order.save();
  }

  @EmitEvent('sales-order.canceled')
  @Transactional()
  async canceledOne(id: string) {
    const order = await SalesOrder.findOneOrFail({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (order.isCanceled) {
      throw new BadRequestException(
        `The order(${order.name}) has been canceled`,
      );
    }
    if (order.fulfillmentStatus === SalesOrderFulfillmentStatus.FULFILLED) {
      throw new BadRequestException(
        `The order(${order.name}) has been fulfilled`,
      );
    }

    order.isCanceled = true;
    order.canceledAt = new Date();
    return await order.save();
  }

  private validateIfNeedUpdate(
    order: { id: string; meta: SalesOrderMeta },
    meta: SalesOrderMeta,
  ) {
    // drop older webhook
    if (order.meta?.lastWebhookRecordId && meta.lastWebhookRecordId) {
      const isSameWebhook =
        order.meta.lastWebhookRecordId === meta.lastWebhookRecordId;
      const isOlderWebhook = moment(order.meta.lastWebhookUpdatedAt).isAfter(
        meta.lastWebhookUpdatedAt,
      );

      this.logger.debug(
        `orderId: ${order.id}, isSameWebhook: ${isSameWebhook}, isOlderWebhook: ${isOlderWebhook}`,
      );

      return !(isSameWebhook || isOlderWebhook);
    }

    return true;
  }

  private async generateOrderSN(platformType?: SalesOrderPlatformType) {
    let prefix: string;
    switch (platformType) {
      case SalesOrderPlatformType.PIETRA_SHOPIFY:
        prefix = 'PS';
        break;
      case SalesOrderPlatformType.STORE_SHOPIFY:
        prefix = 'SS';
        break;
      default:
        prefix = 'PP';
    }
    return await this.commonService.generateSN('ORDER', prefix);
  }
}
