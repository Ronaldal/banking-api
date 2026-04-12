import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../enums/account-type.enum';

export class AccountResponse {
  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ example: 1 })
  personId!: number;

  @ApiProperty({ example: 1000.5 })
  balance!: number;

  @ApiProperty({ example: 500 })
  dailyWithdrawalLimit!: number;

  @ApiProperty({ example: true })
  activeFlag!: boolean;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  accountType!: AccountType;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createDate!: Date;
}

export class BalanceResponse {
  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ example: 1000.5 })
  balance!: number;
}

export class BlockResponse {
  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ example: false })
  activeFlag!: boolean;
}
