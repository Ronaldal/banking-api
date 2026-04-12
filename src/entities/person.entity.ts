import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Account } from './account.entity';

@Entity('pessoas')
export class Person {
  @PrimaryGeneratedColumn()
  personId!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  document!: string;

  @Column({ type: 'date' })
  birthDate!: Date;

  @OneToMany(() => Account, (account) => account.person)
  accounts!: Account[];
}
