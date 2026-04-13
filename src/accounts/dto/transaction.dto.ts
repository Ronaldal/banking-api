import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class TransactionDto {
  @ApiProperty({
    description: 'The monetary value of the transaction',
    example: 150.5,
  })
  @IsNumber()
  value!: number;
}
