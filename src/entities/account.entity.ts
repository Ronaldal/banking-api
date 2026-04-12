import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Person } from './person.entity';
import { Transaction } from './transaction.entity';
import { AccountType } from 'src/enums/account-type.enum';

@Entity('account')
export class Account {
  @PrimaryGeneratedColumn()
  accountId!: number;

  @Column()
  personId!: number;

  @ManyToOne(() => Person, (person) => person.accounts)
  @JoinColumn({ name: 'personId' })
  person!: Person;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  dailyWithdrawalLimit!: number;

  @Column({ type: 'boolean', default: true })
  activeFlag!: boolean;

  @Column({ type: 'int', enum: AccountType })
  accountType!: AccountType;

  @CreateDateColumn()
  createDate!: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions!: Transaction[];
}
