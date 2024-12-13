import { Redlock } from '@anchan828/nest-redlock';
import { Log } from '@nest-mods/log';
import { OnWorkerEvent, Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import moment from 'moment';
import { BaseProcessor, Process } from '../common/bullmq/bullmq-base-processor';
import { SalesOrderCreateInput } from '../sales/sales-order-create.input';
import { SalesOrderLineItemCreateInput } from '../sales/sales-order-line-item-create.input';
import { SalesOrderPlatformType } from '../sales/sales-order-platform-type.enum';
import { SalesOrder } from '../sales/sales-order.entity';
import { SalesOrderService } from '../sales/sales-order.service';
import { StoreShopfiyAppInfo } from './store-shopfiy-app-info.entity';
import { StoreShopifyWebhookRecord } from './store-shopify-webhook-record.entity';

@Processor('v2-store-shopify-webhook')
export class StoreShopifyWebhookProcessor extends BaseProcessor {
  @Log() logger: Logger;

  constructor(private salesService: SalesOrderService) {
    super();
  }

  @Process({ name: 'handle-order-webhooks' })
  async handleOrderWebhooksFromRecord(job: Job<{ recordId: string }>) {
    const record = await StoreShopifyWebhookRecord.findOneOrFail({
      where: { id: job.data.recordId },
    });

    const info = await StoreShopfiyAppInfo.findOneByShopCached(record.shop);
    const shopifyOrder = record.body;

    let salesOrder: SalesOrder;
    switch (record.topic) {
      case 'orders/create':
      case 'orders/updated':
        salesOrder = await this.handleOrderCreateOrUpdate(
          info,
          shopifyOrder,
          record.id,
        );
        return { id: salesOrder.id, name: salesOrder.name };
      case 'orders/fulfilled':
        salesOrder = await this.handleOrderFulfilled(
          info,
          shopifyOrder,
          record.id,
        );
        return {
          id: salesOrder.id,
          name: salesOrder.name,
          fulfillmentStatus: salesOrder.fulfillmentStatus,
          fulfilledAt: salesOrder.fulfilledAt,
        };
      case 'orders/cancelled':
        salesOrder = await this.handleOrderCanceled(
          info,
          shopifyOrder,
          record.id,
        );
        return {
          id: salesOrder.id,
          name: salesOrder.name,
          isCanceled: salesOrder.isCanceled,
          canceledAt: salesOrder.canceledAt,
        };
      case 'app/uninstalled':
        await info.remove();
        break;
      default:
        return `unexpected topic ${record.topic}`;
    }
  }

  @Redlock<StoreShopifyWebhookProcessor['handleOrderCreateOrUpdate']>(
    (_target, info, shopifyOrder) =>
      `${StoreShopifyWebhookProcessor.name}#handleOrderCreateOrUpdate(${info.shopName},${shopifyOrder.id})`,
  )
  private async handleOrderCreateOrUpdate(
    info: StoreShopfiyAppInfo,
    shopifyOrder: any,
    webhookRecordId: string,
  ) {
    this.logger.debug(
      `StoreShopifyWebhookProcessor#handleOrderCreateOrUpdate storeId=${info.storeId}, referenceId=${shopifyOrder.id}, webhookRecordId=${webhookRecordId}`,
    );

    const inOrder: SalesOrderCreateInput = {
      platformType: SalesOrderPlatformType.STORE_SHOPIFY,
      storeId: info.storeId,
      referenceId: String(shopifyOrder.id),
      name: shopifyOrder.name,
    };

    const inLineItems: SalesOrderLineItemCreateInput[] = [];

    for (const it of shopifyOrder.line_items) {
      inLineItems.push({
        referenceId: String(it.id),
        name: it.name,
        sku: it.sku,
        quantity: it.quantity,
      });
    }

    return await this.salesService.saveOne(inOrder, inLineItems, {
      lastWebhookRecordId: webhookRecordId,
      lastWebhookUpdatedAt: moment(shopifyOrder.updated_at).toDate(),
    });
  }

  private async handleOrderFulfilled(
    info: StoreShopfiyAppInfo,
    shopifyOrder: any,
    webhookRecordId: string,
  ) {
    this.logger.debug(
      `StoreShopifyWebhookProcessor#handleOrderFulfilled storeId=${info.storeId}, referenceId=${shopifyOrder.id}, webhookRecordId=${webhookRecordId}`,
    );
    const order = await SalesOrder.findOneOrFail({
      where: {
        platformType: SalesOrderPlatformType.STORE_SHOPIFY,
        storeId: info.storeId,
        referenceId: String(shopifyOrder.id),
      },
      select: ['id'],
    });
    return await this.salesService.fulfilledOne(order.id);
  }

  private async handleOrderCanceled(
    info: StoreShopfiyAppInfo,
    shopifyOrder: any,
    webhookRecordId: string,
  ) {
    this.logger.debug(
      `StoreShopifyWebhookProcessor#handleOrderCanceled storeId=${info.storeId}, referenceId=${shopifyOrder.id}, webhookRecordId=${webhookRecordId}`,
    );
    const order = await SalesOrder.findOneOrFail({
      where: {
        platformType: SalesOrderPlatformType.STORE_SHOPIFY,
        storeId: info.storeId,
        referenceId: String(shopifyOrder.id),
      },
      select: ['id'],
    });

    return await this.salesService.canceledOne(order.id);
  }

  @OnWorkerEvent('completed')
  async onQueueCompleted(job: Job, result: any) {
    await StoreShopifyWebhookRecord.appendHandledJob(job);
  }
}
