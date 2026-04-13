import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Person } from '../entities/person.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import {
  BalanceResponse,
  BlockResponse,
} from '../interfaces/account.interfaces';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
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
}
