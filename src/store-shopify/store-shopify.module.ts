import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreShopfiyAppInfo } from './store-shopfiy-app-info.entity';
import { StoreShopifyWebhookRecord } from './store-shopify-webhook-record.entity';
import { StoreShopifyWebhookProcessor } from './store-shopify-webhook.processor';
import { StoreShopifyController } from './store-shopify.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([StoreShopfiyAppInfo, StoreShopifyWebhookRecord]),
    BullModule.registerQueue({ name: 'v2-store-shopify-webhook' }),
  ],
  controllers: [StoreShopifyController],
  providers: [StoreShopifyWebhookProcessor],
  exports: [BullModule.registerQueue({ name: 'v2-store-shopify-webhook' })],
})
export class StoreShopifyModule {}
