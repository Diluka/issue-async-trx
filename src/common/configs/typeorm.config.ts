import { TypeORMLogger } from '@app/shared';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('typeorm', () => {
  return {
    type: 'mysql',
    host: process.env.TYPEORM_HOST || '127.0.0.1',
    port: +process.env.TYPEORM_PORT || 3306,
    database: process.env.TYPEORM_DATABASE || 'test',
    username: process.env.TYPEORM_USERNAME || 'root',
    password: process.env.TYPEORM_PASSWORD || 'root',
    synchronize: true,
    autoLoadEntities: true,
    entityPrefix: 'tmp_',
    logging: true,
    logger: new TypeORMLogger(true),
  } as TypeOrmModuleOptions;
});
