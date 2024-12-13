import { IDColumnOpts } from '@app/shared';
import { Column, Entity, Index } from 'typeorm';
import { BaseJobRecordEntity } from '../common';

@Index(['shop', 'topic'])
@Entity()
export class StoreShopifyWebhookRecord extends BaseJobRecordEntity {
  @Column({ ...IDColumnOpts })
  webhookId: string;

  @Column({ length: 64 })
  shop: string;

  @Column({ type: 'varchar', length: 32 })
  topic: string;

  @Column({ length: 16 })
  version: string;

  @Column()
  hmac: string;

  @Column({ type: 'datetime', precision: 3 })
  triggeredAt: Date;

  @Column({ type: 'json', nullable: true })
  body: any;
}
