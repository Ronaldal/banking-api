import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockManager = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockDataSource = {
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

  describe('getStatement', () => {
    it('should return all transactions for an account', async () => {
      const account = { accountId: 1 };
      const transactions = [
        { transactionId: 1, accountId: 1, value: 500, transactionDate: new Date() },
        { transactionId: 2, accountId: 1, value: -200, transactionDate: new Date() },
      ];

      mockManager.findOne.mockResolvedValue(account);
      mockManager.find.mockResolvedValue(transactions);

      const result = await service.getStatement(1, {});

      expect(result).toEqual(transactions);
      expect(result.length).toBe(2);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.getStatement(999, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(mockManager.find).not.toHaveBeenCalled();
    });

    it('should filter by date range when both dates provided', async () => {
      mockManager.findOne.mockResolvedValue({ accountId: 1 });
      mockManager.find.mockResolvedValue([]);

      await service.getStatement(1, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(mockManager.find).toHaveBeenCalled();
    });
  });
});
