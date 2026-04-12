import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum } from 'class-validator';
import { AccountType } from '../../enums/account-type.enum';

export class CreateAccountDto {
  @ApiProperty({
    description: 'The ID of the person who owns the account',
    example: 1,
  })
  @IsNumber()
  personId!: number;

  @ApiProperty({ description: 'Daily limit for withdrawals', example: 1000.0 })
  @IsNumber()
  dailyWithdrawalLimit!: number;

  @ApiProperty({
    description: 'Type of the account',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  @IsEnum(AccountType)
  accountType!: AccountType;
}
