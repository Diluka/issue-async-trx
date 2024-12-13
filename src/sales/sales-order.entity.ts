import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Store } from '../store/store.entity';
import { SalesCreatorOrder } from './sales-creator-order.entity';
import { SalesOrderFulfillmentStatus } from './sales-order-fulfillment-status.enum';
import { SalesOrderLineItem } from './sales-order-line-item.entity';
import { SalesOrderPlatformType } from './sales-order-platform-type.enum';

export interface SalesOrderMeta {
  lastWebhookRecordId?: string;
  lastWebhookUpdatedAt?: string | Date;
}

@Unique(['sn'])
@Unique(['platformType', 'storeId', 'referenceId'])
@Entity()
export class SalesOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  platformType: SalesOrderPlatformType;

  @Column({ ...IDColumnOpts, nullable: true })
  storeId: string;

  @Column({ length: 64, nullable: true })
  referenceId: string;

  @Column({ type: 'varchar', length: 32 })
  sn: string;

  @Column({ length: 64 })
  name: string;

  @Column({ type: 'json', nullable: true })
  meta: SalesOrderMeta;

  @Column({
    type: 'varchar',
    length: 32,
    default: SalesOrderFulfillmentStatus.NONE,
  })
  fulfillmentStatus: SalesOrderFulfillmentStatus;

  @Column({ nullable: true })
  fulfilledAt: Date;

  @Column({ default: false })
  isCanceled: boolean;

  @Column({ nullable: true })
  canceledAt: Date;

  @ManyToOne(() => Store)
  store: Store;

  @OneToMany(() => SalesOrderLineItem, (o) => o.salesOrder)
  items: SalesOrderLineItem[];

  @OneToMany(() => SalesCreatorOrder, (o) => o.salesOrder)
  salesCreatorOrders: SalesCreatorOrder[];
}
