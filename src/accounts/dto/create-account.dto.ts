import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { AccountType } from '../../enums/account-type.enum';

export class CreateAccountDto {
  @ApiProperty({
    description: 'The ID of the person who owns the account',
    example: 1,
  })
  @IsNumber()
  personId!: number;

  @ApiProperty({
    description: 'The document of the person (must match the person record)',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  document!: string;

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
