import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionType } from '../enums/transaction-type.enum';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    manager: mockManager,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processTransaction - deposit', () => {
    it('should deposit successfully and return balance', async () => {
      const account = { accountId: 1, balance: 500, activeFlag: true };
      const savedTransaction = {
        transactionId: 1,
        accountId: 1,
        value: 200,
        transactionDate: new Date(),
      };

      mockManager.findOne.mockResolvedValue(account);
      mockManager.create.mockReturnValue({ accountId: 1, value: 200 });
      mockManager.save
        .mockResolvedValueOnce(account)
        .mockResolvedValueOnce(savedTransaction);

      const result = await service.processTransaction(
        1,
        { value: 200 },
        TransactionType.DEPOSIT,
      );

      expect(result.transactionId).toBe(1);
      expect(result.value).toBe(200);
      expect(result.balance).toBe(700);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException for zero value', async () => {
      await expect(
        service.processTransaction(1, { value: 0 }, TransactionType.DEPOSIT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative value', async () => {
      await expect(
        service.processTransaction(1, { value: -100 }, TransactionType.DEPOSIT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.processTransaction(999, { value: 100 }, TransactionType.DEPOSIT),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when account is blocked', async () => {
      mockManager.findOne.mockResolvedValue({
        accountId: 1,
        activeFlag: false,
      });

      await expect(
        service.processTransaction(1, { value: 100 }, TransactionType.DEPOSIT),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('processTransaction - withdrawal', () => {
    it('should withdraw successfully and return balance', async () => {
      const account = {
        accountId: 1,
        balance: 1000,
        activeFlag: true,
        dailyWithdrawalLimit: 500,
      };
      const savedTransaction = {
        transactionId: 2,
        accountId: 1,
        value: -200,
        transactionDate: new Date(),
      };

      mockManager.findOne.mockResolvedValue(account);
      mockManager.create.mockReturnValue({ accountId: 1, value: -200 });
      mockManager.save
        .mockResolvedValueOnce(account)
        .mockResolvedValueOnce(savedTransaction);

      const result = await service.processTransaction(
        1,
        { value: 200 },
        TransactionType.WITHDRAWAL,
      );

      expect(result.transactionId).toBe(2);
      expect(result.value).toBe(-200);
      expect(result.balance).toBe(800);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException for zero value', async () => {
      await expect(
        service.processTransaction(1, { value: 0 }, TransactionType.WITHDRAWAL),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.processTransaction(
          1,
          { value: 100 },
          TransactionType.WITHDRAWAL,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when account is blocked', async () => {
      mockManager.findOne.mockResolvedValue({
        accountId: 1,
        activeFlag: false,
      });

      await expect(
        service.processTransaction(
          1,
          { value: 100 },
          TransactionType.WITHDRAWAL,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      mockManager.findOne.mockResolvedValue({
        accountId: 1,
        balance: 50,
        activeFlag: true,
        dailyWithdrawalLimit: 1000,
      });

      await expect(
        service.processTransaction(
          1,
          { value: 200 },
          TransactionType.WITHDRAWAL,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when exceeding daily withdrawal limit', async () => {
      mockManager.findOne.mockResolvedValue({
        accountId: 1,
        balance: 5000,
        activeFlag: true,
        dailyWithdrawalLimit: 100,
      });

      await expect(
        service.processTransaction(
          1,
          { value: 200 },
          TransactionType.WITHDRAWAL,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
