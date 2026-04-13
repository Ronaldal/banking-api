import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { GetStatementFilterDto } from './dto/get-statement-filter.dto';
import { ROUTES } from '../consts/routes.consts';
import { StatementItem } from '../interfaces/transaction.interfaces';

@ApiTags('Transactions')
@Controller(ROUTES.TRANSACTIONS)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post(':id/statement')
  @ApiOperation({ summary: 'Get account transactions filtered by date period' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the account',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns filtered transactions.',
    type: [StatementItem],
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async getStatement(
    @Param('id', ParseIntPipe) id: number,
    @Body() filter: GetStatementFilterDto,
  ): Promise<StatementItem[]> {
    return this.transactionsService.getStatement(id, filter);
  }
}
