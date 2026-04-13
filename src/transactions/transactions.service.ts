import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { TransactionDto } from './dto/transaction.dto';
import { GetStatementFilterDto } from './dto/get-statement-filter.dto';
import {
  StatementItem,
  TransactionResponse,
} from '../interfaces/transaction.interfaces';
import { TransactionType } from '../enums/transaction-type.enum';

@Injectable()
export class TransactionsService {
  constructor(private readonly dataSource: DataSource) {}

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

  async getStatement(
    accountId: number,
    filter: GetStatementFilterDto,
  ): Promise<StatementItem[]> {
    const account = await this.dataSource.manager.findOne(Account, {
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const where: Record<string, unknown> = { accountId };

    if (filter.startDate && filter.endDate) {
      where.transactionDate = Between(
        new Date(filter.startDate),
        new Date(filter.endDate + 'T23:59:59'),
      );
    } else if (filter.startDate) {
      where.transactionDate = MoreThanOrEqual(new Date(filter.startDate));
    } else if (filter.endDate) {
      where.transactionDate = LessThanOrEqual(
        new Date(filter.endDate + 'T23:59:59'),
      );
    }

    return this.dataSource.manager.find(Transaction, {
      where,
      order: { transactionDate: 'DESC' },
    });
  }
}
