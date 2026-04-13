import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { Person } from '../entities/person.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from './dto/transaction.dto';
import {
  BalanceResponse,
  BlockResponse,
} from '../interfaces/account.interfaces';
import { TransactionResponse } from '../interfaces/transaction.interfaces';
import { TransactionType } from '../enums/transaction-type.enum';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly dataSource: DataSource,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto): Promise<Account> {
    const { personId, document, dailyWithdrawalLimit, accountType } =
      createAccountDto;

    const person = await this.personRepository.findOne({ where: { personId } });
    if (!person) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }

    if (person.document !== document) {
      throw new BadRequestException(
        'Document does not match the person record',
      );
    }

    const newAccount = this.accountRepository.create({
      personId,
      dailyWithdrawalLimit,
      accountType,
    });

    return await this.accountRepository.save(newAccount);
  }

  async getBalance(accountId: number): Promise<BalanceResponse> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
      select: ['accountId', 'balance'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    return {
      accountId: account.accountId,
      balance: Number(account.balance),
    };
  }

  async blockAccount(accountId: number): Promise<BlockResponse> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    if (!account.activeFlag) {
      throw new BadRequestException('Account is already blocked');
    }

    account.activeFlag = false;
    await this.accountRepository.save(account);

    return {
      accountId: account.accountId,
      activeFlag: account.activeFlag,
    };
  }

  async processTransaction(
    accountId: number,
    dto: TransactionDto,
    type: TransactionType,
  ): Promise<TransactionResponse> {
    if (dto.value <= 0) {
      throw new BadRequestException('Value must be greater than zero');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(Account, {
        where: { accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) throw new NotFoundException('Account not found');
      if (!account.activeFlag)
        throw new BadRequestException('Account is blocked');

      if (type === TransactionType.WITHDRAWAL) {
        if (Number(account.balance) < dto.value) {
          throw new BadRequestException('Insufficient balance');
        }
        if (dto.value > Number(account.dailyWithdrawalLimit)) {
          throw new BadRequestException(
            'Amount exceeds daily withdrawal limit',
          );
        }
      }

      const transactionValue =
        type === TransactionType.DEPOSIT ? dto.value : -dto.value;

      account.balance = Number(account.balance) + transactionValue;
      await queryRunner.manager.save(account);

      const transaction = queryRunner.manager.create(Transaction, {
        accountId,
        value: transactionValue,
      });
      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return {
        transactionId: savedTransaction.transactionId,
        accountId: savedTransaction.accountId,
        value: Number(savedTransaction.value),
        balance: Number(account.balance),
        transactionDate: savedTransaction.transactionDate,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error instanceof BadRequestException ||
        error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }
}
