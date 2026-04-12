import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from '../transactions/dto/transaction.dto';
import { GetStatementFilterDto } from '../transactions/dto/get-statement-filter.dto';
import { ROUTES } from '../consts/routes.consts';
import {
  AccountResponse,
  BalanceResponse,
  BlockResponse,
} from '../interfaces/account.interfaces';
import { TransactionResponse } from '../interfaces/transaction.interfaces';

@ApiTags('Accounts')
@Controller(ROUTES.ACCOUNTS)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new banking account' })
  @ApiResponse({
    status: 201,
    description: 'The account has been successfully created.',
    type: AccountResponse,
  })
  @ApiResponse({ status: 404, description: 'Person not found.' })
  async create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.createAccount(createAccountDto);
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Deposit money into an account' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the account',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Deposit successful.',
    type: TransactionResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., account blocked).',
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async deposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransactionDto,
  ): Promise<TransactionResponse> {
    return this.transactionsService.deposit(id, dto);
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the account',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal successful.',
    type: TransactionResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance or limit exceeded.',
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransactionDto,
  ): Promise<TransactionResponse> {
    return this.transactionsService.withdraw(id, dto);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the account',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the current balance of the account.',
    type: BalanceResponse,
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async getBalance(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BalanceResponse> {
    return await this.accountsService.getBalance(id);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Block an account' })
  @ApiParam({ name: 'id', description: 'The ID of the account to block' })
  @ApiResponse({
    status: 200,
    description: 'Account blocked successfully.',
    type: BlockResponse,
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiResponse({ status: 400, description: 'Account is already blocked.' })
  async blockAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BlockResponse> {
    return await this.accountsService.blockAccount(id);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get account transactions filtered by date period' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the account',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered transactions.',
    type: [TransactionResponse],
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async getStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query() filter: GetStatementFilterDto,
  ): Promise<TransactionResponse[]> {
    return this.transactionsService.getStatement(id, filter);
  }
}
