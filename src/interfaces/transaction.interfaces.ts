import { ApiProperty } from '@nestjs/swagger';

export class StatementItem {
  @ApiProperty({ example: 1 })
  transactionId!: number;

  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ example: 150.5 })
  value!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  transactionDate!: Date;
}

export class TransactionResponse extends StatementItem {
  @ApiProperty({ example: 300.0 })
  balance!: number;
}
