import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../src/accounts/accounts.module';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { PersonsModule } from '../src/persons/persons.module';
import { AccountType } from '../src/enums/account-type.enum';
import { DataSource } from 'typeorm';
import {
  AccountResponse,
  BalanceResponse,
  BlockResponse,
} from '../src/interfaces/account.interfaces';
import {
  TransactionResponse,
  StatementItem,
} from '../src/interfaces/transaction.interfaces';
import { getDatabaseConfig } from '../src/config/database.config';
import { Person } from '../src/entities/person.entity';
import { Account } from '../src/entities/account.entity';
import { Transaction } from '../src/entities/transaction.entity';

describe('Accounts (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(getDatabaseConfig({ dropSchema: true })),
        PersonsModule,
        AccountsModule,
        TransactionsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  let personId: number;
  let accountId: number;

  describe('Setup - Person seeded via onModuleInit', () => {
    it('should have seeded a default person', async () => {
      const personRepo = dataSource.getRepository(Person);
      const persons = await personRepo.find();
      expect(persons.length).toBeGreaterThanOrEqual(1);
      personId = persons[0].personId;
    });
  });

  describe('POST /accounts', () => {
    it('should create a new account', async () => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          personId,
          document: '123456789',
          dailyWithdrawalLimit: 1000,
          accountType: AccountType.CHECKING,
        })
        .expect(201);

      const body = res.body as AccountResponse;
      expect(body.accountId).toBeDefined();
      expect(body.personId).toBe(personId);
      expect(Number(body.balance)).toBe(0);
      expect(body.activeFlag).toBe(true);
      accountId = body.accountId;

      const dbAccount = await dataSource
        .getRepository(Account)
        .findOne({ where: { accountId } });
      expect(dbAccount).not.toBeNull();
      expect(dbAccount!.personId).toBe(personId);
      expect(Number(dbAccount!.balance)).toBe(0);
      expect(dbAccount!.activeFlag).toBe(true);
    });

    it('should return 400 for wrong document', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({
          personId,
          document: 'wrong-document',
          dailyWithdrawalLimit: 1000,
          accountType: AccountType.CHECKING,
        })
        .expect(400);
    });

    it('should return 404 for non-existent person', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({
          personId: 9999,
          document: '123456789',
          dailyWithdrawalLimit: 1000,
          accountType: AccountType.CHECKING,
        })
        .expect(404);
    });
  });

  describe('POST /accounts/:id/deposit', () => {
    it('should deposit money successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/accounts/${accountId}/deposit`)
        .send({ value: 500 })
        .expect(201);

      const body = res.body as TransactionResponse;
      expect(Number(body.value)).toBe(500);
      expect(body.accountId).toBe(accountId);
      expect(body.balance).toBe(500);

      const dbAccount = await dataSource
        .getRepository(Account)
        .findOne({ where: { accountId } });
      expect(Number(dbAccount!.balance)).toBe(500);

      const dbTransaction = await dataSource
        .getRepository(Transaction)
        .findOne({ where: { transactionId: body.transactionId } });
      expect(dbTransaction).not.toBeNull();
      expect(Number(dbTransaction!.value)).toBe(500);
    });

    it('should reject deposit with zero value', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/deposit`)
        .send({ value: 0 })
        .expect(400);
    });

    it('should reject deposit to non-existent account', async () => {
      await request(app.getHttpServer())
        .post('/accounts/9999/deposit')
        .send({ value: 100 })
        .expect(404);
    });
  });

  describe('GET /accounts/:id/balance', () => {
    it('should return the current balance', async () => {
      const res = await request(app.getHttpServer())
        .get(`/accounts/${accountId}/balance`)
        .expect(200);

      const body = res.body as BalanceResponse;
      expect(body.accountId).toBe(accountId);
      expect(body.balance).toBe(500);
    });

    it('should return 404 for non-existent account', async () => {
      await request(app.getHttpServer())
        .get('/accounts/9999/balance')
        .expect(404);
    });
  });

  describe('POST /accounts/:id/withdraw', () => {
    it('should withdraw money successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({ value: 200 })
        .expect(201);

      const body = res.body as TransactionResponse;
      expect(Number(body.value)).toBe(-200);
      expect(body.accountId).toBe(accountId);
      expect(body.balance).toBe(300);

      const dbAccount = await dataSource
        .getRepository(Account)
        .findOne({ where: { accountId } });
      expect(Number(dbAccount!.balance)).toBe(300);

      const dbTransaction = await dataSource
        .getRepository(Transaction)
        .findOne({ where: { transactionId: body.transactionId } });
      expect(dbTransaction).not.toBeNull();
      expect(Number(dbTransaction!.value)).toBe(-200);
    });

    it('should reject withdrawal exceeding balance', async () => {
      const balanceBefore = await dataSource
        .getRepository(Account)
        .findOne({ where: { accountId } });

      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({ value: 99999 })
        .expect(400);

      const balanceAfter = await dataSource
        .getRepository(Account)
        .findOne({ where: { accountId } });
      expect(Number(balanceAfter!.balance)).toBe(
        Number(balanceBefore!.balance),
      );
    });

    it('should reject withdrawal exceeding daily limit', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({ value: 1001 })
        .expect(400);
    });

    it('should reject withdrawal with zero value', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({ value: 0 })
        .expect(400);
    });
  });

  describe('POST /transactions/:id/statement', () => {
    it('should return all transactions', async () => {
      const res = await request(app.getHttpServer())
        .post(`/transactions/${accountId}/statement`)
        .send({})
        .expect(201);

      const body = res.body as StatementItem[];
      expect(body.length).toBe(2); // 1 deposit + 1 withdrawal
    });

    it('should filter transactions by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app.getHttpServer())
        .post(`/transactions/${accountId}/statement`)
        .send({ startDate: today, endDate: today })
        .expect(201);

      const body = res.body as StatementItem[];
      expect(body.length).toBe(2);
    });

    it('should return empty for future date range', async () => {
      const res = await request(app.getHttpServer())
        .post(`/transactions/${accountId}/statement`)
        .send({ startDate: '2099-01-01', endDate: '2099-12-31' })
        .expect(201);

      const body = res.body as StatementItem[];
      expect(body.length).toBe(0);
    });

    it('should return 404 for non-existent account', async () => {
      await request(app.getHttpServer())
        .post('/transactions/9999/statement')
        .send({})
        .expect(404);
    });
  });

  describe('PATCH /accounts/:id/block', () => {
    it('should block the account', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/accounts/${accountId}/block`)
        .expect(200);

      const body = res.body as BlockResponse;
      expect(body.activeFlag).toBe(false);

      const dbAccount = await dataSource
        .getRepository(Account)
        .findOne({ where: { accountId } });
      expect(dbAccount!.activeFlag).toBe(false);
    });

    it('should reject blocking an already blocked account', async () => {
      await request(app.getHttpServer())
        .patch(`/accounts/${accountId}/block`)
        .expect(400);
    });

    it('should reject deposit to blocked account', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/deposit`)
        .send({ value: 100 })
        .expect(400);
    });

    it('should reject withdrawal from blocked account', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({ value: 50 })
        .expect(400);
    });

    it('should return 404 for non-existent account', async () => {
      await request(app.getHttpServer())
        .patch('/accounts/9999/block')
        .expect(404);
    });
  });
});
