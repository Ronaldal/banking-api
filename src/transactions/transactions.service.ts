import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { GetStatementFilterDto } from './dto/get-statement-filter.dto';
import { StatementItem } from '../interfaces/transaction.interfaces';

@Injectable()
export class TransactionsService {
  constructor(private readonly dataSource: DataSource) {}

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
