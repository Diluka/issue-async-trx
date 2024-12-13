import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Store])],
})
export class StoreModule {}
