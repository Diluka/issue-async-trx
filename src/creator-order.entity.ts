import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class CreatorOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  orderId: number;

  @ManyToOne(() => Order)
  order: Order;

  @Column({ nullable: true })
  field1: string;

  @Column({ nullable: true })
  field2: string;

  @Column({ nullable: true })
  status: string;
}
