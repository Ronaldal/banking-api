import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';
import { Person } from '../entities/person.entity';
import { AccountType } from '../enums/account-type.enum';

describe('AccountsService', () => {
  let service: AccountsService;

  const mockAccountRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPersonRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getRepositoryToken(Account), useValue: mockAccountRepository },
        { provide: getRepositoryToken(Person), useValue: mockPersonRepository },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const dto = {
      personId: 1,
      dailyWithdrawalLimit: 1000,
      accountType: AccountType.CHECKING,
    };

    it('should create an account when person exists', async () => {
      const person = { personId: 1, name: 'John Doe' };
      const createdAccount = { accountId: 1, ...dto, balance: 0, activeFlag: true };

      mockPersonRepository.findOne.mockResolvedValue(person);
      mockAccountRepository.create.mockReturnValue(createdAccount);
      mockAccountRepository.save.mockResolvedValue(createdAccount);

      const result = await service.createAccount(dto);

      expect(result).toEqual(createdAccount);
      expect(mockPersonRepository.findOne).toHaveBeenCalledWith({ where: { personId: 1 } });
      expect(mockAccountRepository.create).toHaveBeenCalledWith({
        personId: 1,
        dailyWithdrawalLimit: 1000,
        accountType: AccountType.CHECKING,
      });
      expect(mockAccountRepository.save).toHaveBeenCalledWith(createdAccount);
    });

    it('should throw NotFoundException when person does not exist', async () => {
      mockPersonRepository.findOne.mockResolvedValue(null);

      await expect(service.createAccount(dto)).rejects.toThrow(NotFoundException);
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });
  });
});
