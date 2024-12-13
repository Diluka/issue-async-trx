import { Log } from '@nest-mods/log';
import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Request } from 'express';
import { StoreShopifyWebhookRecord } from './store-shopify-webhook-record.entity';

@Controller('store-shopify')
export class StoreShopifyController {
  @Log() private logger: Logger;

  constructor(@InjectQueue('v2-store-shopify-webhook') private queue: Queue) {}

  @Post('-/webhooks')
  async webhook(
    @Headers('X-Shopify-Topic') topic: string,
    @Headers('X-Shopify-Hmac-Sha256') hmac: string,
    @Headers('X-Shopify-Shop-Domain') shop: string,
    @Headers('X-Shopify-API-Version') version: string,
    @Headers('X-Shopify-Webhook-Id') webhookId: string,
    @Headers('X-Shopify-Triggered-At') triggeredAt: string,
    @Req() req: Request,
  ) {
    this.logger.log(
      `webhooks has been invoked: headerParams=${JSON.stringify({
        topic,
        hmac,
        shop,
        version,
        webhookId,
        triggeredAt,
      })}`,
    );

    const record = await StoreShopifyWebhookRecord.create({
      webhookId,
      shop,
      topic,
      hmac,
      version,
      triggeredAt: new Date(triggeredAt),
      body: req.body,
    }).save();

    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
      case 'orders/fulfilled':
      case 'orders/cancelled':
      case 'app/uninstalled':
        await this.queue.add(
          'handle-order-webhooks',
          { recordId: record.id },
          {},
        );
        break;
    }
  }
}
