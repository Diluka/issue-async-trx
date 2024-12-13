import { BaseEntity } from '@app/shared';
import { Column, Entity } from 'typeorm';

@Entity()
export class Store extends BaseEntity {
  @Column()
  title: string;
}
