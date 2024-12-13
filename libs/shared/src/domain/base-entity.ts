import { instanceToPlain } from 'class-transformer';
import _ from 'lodash';
import { Snowflake } from 'nodejs-snowflake';
import {
  BaseEntity as TypeORMBaseEntity,
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export type POJO<T extends BaseEntity> = Partial<
  Omit<T, keyof BaseEntity> & Pick<T, 'id' | 'createdAt' | 'updatedAt'>
>;

export const IDColumnOpts = { charset: 'ascii', length: 36 };

const snowflake = new Snowflake({
  custom_epoch: 1514764800000,
});

export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryColumn({ comment: 'ID', ...IDColumnOpts })
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toJSON(): POJO<this> {
    return instanceToPlain(this) as any;
  }

  stringify() {
    return JSON.stringify(this);
  }

  // 不使用自带的uuid策略
  // 生成的字段类型有问题, 而且仅针对mysql有问题
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id =
        snowflake.getUniqueID().toString(36) +
        _.random(36 ** 2)
          .toString(36)
          .padStart(2, '0');
    }
  }
}
