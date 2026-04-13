# Banking API

A RESTful banking system API built with NestJS, TypeORM, and PostgreSQL.

## Features

- Account management (create, block)
- Deposit and withdrawal with balance tracking
- Transaction history with date filtering
- Swagger API documentation
- pgAdmin for database management

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **pgAdmin** on port `5050`

### 2. Install dependencies

```bash
npm install
```

### 3. Start the application

```bash
npm run start:dev
```

The API runs on `http://localhost:3050`.

### 4. Swagger documentation

Open `http://localhost:3050/api` in your browser.

## Default Seed Data

When the application starts, a default person is automatically seeded with `onModuleInit` in `persons.service.ts` (if the table is empty):

| Field     | Value       |
|-----------|-------------|
| name      | John Doe    |
| document  | 123456789   |
| birthDate | 1990-01-01  |

You can use `personId: 1` and `document: "123456789"` to create your first account right away.

### Additional Seed Data

To populate the database with more sample data (3 persons, 4 accounts, 7 transactions), run:

```bash
npm run seed
```

This creates:

| Person        | Document  | Accounts                     |
|---------------|-----------|------------------------------|
| John Doe      | 123456789 | Checking (balance: 1300), Savings (balance: 5000) |
| Jane Smith    | 987654321 | Checking (balance: 2250)     |
| Bob Johnson   | 555666777 | Investment (balance: 10000)  |

## pgAdmin

pgAdmin is included in Docker for database management.

- URL: `http://localhost:5050`
- Login: `admin@admin.com` / `admin_password`

To connect to the database from pgAdmin:

| Field    | Value            |
|----------|------------------|
| Host     | `postgres` (not localhost) |
| Port     | `5432`           |
| Username | `admin`          |
| Password | `admin_password` |
| Database | `banking_system` |

## API Endpoints

| Method  | Endpoint                          | Description                        |
|---------|-----------------------------------|------------------------------------|
| POST    | `/accounts`                       | Create a new account               |
| POST    | `/accounts/:id/deposit`           | Deposit money                      |
| POST    | `/accounts/:id/withdraw`          | Withdraw money                     |
| GET     | `/accounts/:id/balance`           | Get current balance                |
| PATCH   | `/accounts/:id/block`             | Block an account                   |
| POST    | `/transactions/:id/statement`     | Get transactions (optional date filter in body) |

## Environment Variables

| Variable    | Default          | Description          |
|-------------|------------------|----------------------|
| DB_HOST     | localhost        | Database host        |
| DB_PORT     | 5432             | Database port        |
| DB_USER     | admin            | Database username    |
| DB_PASSWORD | admin_password   | Database password    |
| DB_NAME     | banking_system   | Database name        |
| PORT        | 3050             | Application port     |

## Running Tests

Make sure Docker is running before executing tests (e2e tests require the database).

```bash
# Run all tests (unit + e2e)
npm test

# Run unit tests only
npm run test:unit

# Run e2e tests only
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Architecture

```
Request
  |
  ├── AccountsController ──> AccountsService ──> DB
  |     (create, deposit,      (processTransaction,
  |      withdraw, balance,     createAccount,
  |      block)                 getBalance, blockAccount)
  |
  └── TransactionsController ──> TransactionsService ──> DB
        (statement)                (getStatement)
```

- **AccountsController** handles account operations, delegates to **AccountsService**
- **AccountsService** owns `processTransaction` (atomic deposit/withdraw with pessimistic locking)
- **TransactionsController** handles statement queries, delegates to **TransactionsService**
- **TransactionsService** owns `getStatement` (transaction fetching with date filters)

## Project Structure

```
src/
  accounts/
    accounts.controller.ts    # Account endpoints (create, deposit, withdraw, balance, block)
    accounts.service.ts       # Account logic + processTransaction
    accounts.module.ts
    dto/
      create-account.dto.ts
      transaction.dto.ts
  transactions/
    transactions.controller.ts  # Statement endpoint (POST /transactions/:id/statement)
    transactions.service.ts     # getStatement logic
    transactions.module.ts
    dto/
      get-statement-filter.dto.ts
  persons/
    persons.service.ts        # Seeds default person on startup (onModuleInit)
    persons.module.ts
  entities/
    person.entity.ts          # Person (pessoas table)
    account.entity.ts         # Account
    transaction.entity.ts     # Transaction
  interfaces/
    account.interfaces.ts     # AccountResponse, BalanceResponse, BlockResponse
    transaction.interfaces.ts # TransactionResponse, StatementItem
  enums/
    account-type.enum.ts      # CHECKING, SAVINGS, INVESTMENT
    transaction-type.enum.ts  # DEPOSIT, WITHDRAWAL
  consts/
    routes.consts.ts          # Route path constants
  config/
    database.config.ts        # Shared database configuration
  seed.ts                     # Seed script for sample data
test/
  accounts.e2e-spec.ts       # End-to-end tests
```
