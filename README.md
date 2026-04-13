# Banking API

A RESTful banking system API built with NestJS, TypeORM, and PostgreSQL.

## Features

- Account management (create, block)
- Deposit and withdrawal with balance tracking
- Transaction history with date filtering
- Swagger API documentation

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
- **pgAdmin** on port `5050` (login: `admin@admin.com` / `admin_password`)

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

## API Endpoints

| Method  | Endpoint                          | Description                        |
|---------|-----------------------------------|------------------------------------|
| POST    | `/accounts`                       | Create a new account               |
| POST    | `/accounts/:id/deposit`           | Deposit money                      |
| POST    | `/accounts/:id/withdraw`          | Withdraw money                     |
| GET     | `/accounts/:id/balance`           | Get current balance                |
| PATCH   | `/accounts/:id/block`             | Block an account                   |
| GET     | `/accounts/:id/statement`         | Get all transactions               |
| GET     | `/accounts/:id/statement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Filter by date |

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

# Run tests with coverage
npm run test:cov
```

## Project Structure

```
src/
  accounts/          # Account controller, service, DTOs, module
  transactions/      # Transaction service, DTOs, module
  persons/           # Person service, module (seeds default person)
  entities/          # TypeORM entities (Person, Account, Transaction)
  interfaces/        # Response types
  enums/             # AccountType, TransactionType
  consts/            # Route constants
  config/            # Database configuration
test/
  accounts.e2e-spec.ts  # End-to-end tests
```
