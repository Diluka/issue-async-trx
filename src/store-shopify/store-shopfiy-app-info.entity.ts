import { BaseEntity, IDColumnOpts } from '@app/shared';
import _ from 'lodash';
import ms from 'ms';
import { Column, Entity } from 'typeorm';

@Entity()
export class StoreShopfiyAppInfo extends BaseEntity {
  @Column({ ...IDColumnOpts, unique: true })
  storeId: string;

  @Column({ unique: true })
  shopName: string;

  static async findOneByShopNameCached(shopName: string) {
    return this.findOne({ where: { shopName }, cache: ms('3 minutes') });
  }

  static async findOneByShopCached(shop: string) {
    const shopName = _.chain(shop).split('.').first().value();
    return this.findOneByShopNameCached(shopName);
  }
}
