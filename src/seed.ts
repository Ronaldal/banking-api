import { DataSource } from 'typeorm';
import { Person } from './entities/person.entity';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { AccountType } from './enums/account-type.enum';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin_password',
  database: process.env.DB_NAME || 'banking_system',
  entities: [Person, Account, Transaction],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected.');

  const personRepo = dataSource.getRepository(Person);
  const accountRepo = dataSource.getRepository(Account);
  const transactionRepo = dataSource.getRepository(Transaction);

  // Seed persons
  const persons = [
    {
      name: 'John Doe',
      document: '123456789',
      birthDate: new Date('1990-01-01'),
    },
    {
      name: 'Jane Smith',
      document: '987654321',
      birthDate: new Date('1985-06-15'),
    },
    {
      name: 'Bob Johnson',
      document: '555666777',
      birthDate: new Date('1978-11-30'),
    },
  ];

  const savedPersons: Person[] = [];
  for (const personData of persons) {
    const existing = await personRepo.findOne({
      where: { document: personData.document },
    });
    if (existing) {
      console.log(`Person "${personData.name}" already exists, skipping.`);
      savedPersons.push(existing);
    } else {
      const person = personRepo.create(personData);
      const saved = await personRepo.save(person);
      console.log(`Created person: ${saved.name} (ID: ${saved.personId})`);
      savedPersons.push(saved);
    }
  }

  // Seed accounts
  const accountsData = [
    {
      personId: savedPersons[0].personId,
      dailyWithdrawalLimit: 1000,
      accountType: AccountType.CHECKING,
    },
    {
      personId: savedPersons[0].personId,
      dailyWithdrawalLimit: 5000,
      accountType: AccountType.SAVINGS,
    },
    {
      personId: savedPersons[1].personId,
      dailyWithdrawalLimit: 2000,
      accountType: AccountType.CHECKING,
    },
    {
      personId: savedPersons[2].personId,
      dailyWithdrawalLimit: 3000,
      accountType: AccountType.INVESTMENT,
    },
  ];

  const savedAccounts: Account[] = [];
  for (const accountData of accountsData) {
    const account = accountRepo.create(accountData);
    const saved = await accountRepo.save(account);
    console.log(
      `Created account ID: ${saved.accountId} for person ID: ${saved.personId} (type: ${saved.accountType})`,
    );
    savedAccounts.push(saved);
  }

  // Seed transactions
  const transactionsData = [
    { accountId: savedAccounts[0].accountId, value: 1000 },
    { accountId: savedAccounts[0].accountId, value: 500 },
    { accountId: savedAccounts[0].accountId, value: -200 },
    { accountId: savedAccounts[1].accountId, value: 5000 },
    { accountId: savedAccounts[2].accountId, value: 3000 },
    { accountId: savedAccounts[2].accountId, value: -750 },
    { accountId: savedAccounts[3].accountId, value: 10000 },
  ];

  for (const txData of transactionsData) {
    const transaction = transactionRepo.create(txData);
    await transactionRepo.save(transaction);

    // Update account balance
    const account = await accountRepo.findOne({
      where: { accountId: txData.accountId },
    });
    if (account) {
      account.balance = Number(account.balance) + txData.value;
      await accountRepo.save(account);
    }
  }
  console.log(`Created ${transactionsData.length} transactions.`);

  // Summary
  console.log('\n--- Seed Summary ---');
  for (const account of savedAccounts) {
    const updated = await accountRepo.findOne({
      where: { accountId: account.accountId },
    });
    console.log(`Account ${updated!.accountId}: balance = ${updated!.balance}`);
  }

  await dataSource.destroy();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
