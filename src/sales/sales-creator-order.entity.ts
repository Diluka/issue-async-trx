import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Store } from '../store/store.entity';
import { SalesOrderFulfillmentStatus } from './sales-order-fulfillment-status.enum';
import { SalesOrderLineItem } from './sales-order-line-item.entity';
import { SalesOrder } from './sales-order.entity';

@Entity()
export class SalesCreatorOrder extends BaseEntity {
  @Column({ ...IDColumnOpts })
  storeId: string;

  @Column({ ...IDColumnOpts })
  salesOrderId: string;

  @Column({ type: 'varchar', length: 32 })
  sn: string;

  @Column({ length: 64 })
  name: string;

  @Column({ type: 'bigint', default: 0 })
  totalPriceBp: number;

  @Column({ type: 'bigint', default: 0 })
  subtotalPriceBp: number;

  @Column({ type: 'bigint', default: 0 })
  totalTaxBp: number;

  @Column({ type: 'bigint', default: 0 })
  totalDiscountBp: number;

  @Column({ type: 'bigint', default: 0 })
  totalLineItemPriceBp: number;

  @Column({ type: 'bigint', default: 0 })
  totalLineItemDiscountBp: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: SalesOrderFulfillmentStatus.NONE,
  })
  fulfillmentStatus: SalesOrderFulfillmentStatus;

  @Column({ nullable: true })
  fulfilledAt: Date;

  @ManyToOne(() => Store)
  store: Store;

  @ManyToOne(() => SalesOrder, (o) => o.salesCreatorOrders, {
    onDelete: 'CASCADE',
  })
  salesOrder: SalesOrder;

  @OneToMany(() => SalesOrderLineItem, (o) => o.salesCreatorOrder, {
    createForeignKeyConstraints: false,
  })
  items: SalesOrderLineItem[];
}
