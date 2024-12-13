import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { SalesModule } from './sales/sales.module';
import { StoreShopfiyAppInfo } from './store-shopify/store-shopfiy-app-info.entity';
import { StoreShopifyModule } from './store-shopify/store-shopify.module';
import { Store } from './store/store.entity';
import { StoreModule } from './store/store.module';

@Global()
@Module({
  imports: [CommonModule, SalesModule, StoreModule, StoreShopifyModule],
  controllers: [AppController],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    let testStore = await Store.findOne({ where: { id: 'st-test' } });
    if (!testStore) {
      testStore = await Store.create({
        id: 'st-test',
        title: 'test-store',
      }).save();
      await StoreShopfiyAppInfo.create({
        storeId: testStore.id,
        shopName: 'test-store',
      }).save();
    }
  }
}
