import { BaseEntity, IDColumnOpts } from '@app/shared';
import { Column, Entity, ManyToOne } from 'typeorm';
import { SalesCreatorOrder } from './sales-creator-order.entity';
import { SalesOrderFulfillmentStatus } from './sales-order-fulfillment-status.enum';
import { SalesOrder } from './sales-order.entity';

@Entity()
export class SalesOrderLineItem extends BaseEntity {
  @Column({ ...IDColumnOpts })
  salesOrderId: string;

  @Column({ ...IDColumnOpts, nullable: true })
  salesCreatorOrderId: string;

  @Column({ length: 64, nullable: true })
  referenceId: string;

  @Column({ length: 64 })
  name: string;

  @Column({ length: 64, nullable: true })
  sku: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  fulfilledQuantity: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: SalesOrderFulfillmentStatus.NONE,
  })
  fulfillmentStatus: SalesOrderFulfillmentStatus;

  @Column({ nullable: true })
  fulfilledAt: Date;

  @ManyToOne(() => SalesOrder, (o) => o.items, { onDelete: 'CASCADE' })
  salesOrder: SalesOrder;

  @ManyToOne(() => SalesCreatorOrder, (o) => o.items, {
    createForeignKeyConstraints: false,
  })
  salesCreatorOrder: SalesCreatorOrder;
}
