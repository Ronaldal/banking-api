import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Person } from '../entities/person.entity';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';

interface DatabaseConfigOverrides {
  dropSchema?: boolean;
  synchronize?: boolean;
}

export const getDatabaseConfig = (
  overrides: DatabaseConfigOverrides = {},
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin_password',
  database: process.env.DB_NAME || 'banking_system',
  entities: [Person, Account, Transaction],
  synchronize: true,
  ...overrides,
});
