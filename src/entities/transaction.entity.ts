import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  transactionId!: number;

  @Column()
  accountId!: number;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value!: number;

  @CreateDateColumn()
  transactionDate!: Date;
}
