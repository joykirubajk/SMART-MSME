# Database setup (Windows)

Postgres was **not installed** on the machine where Phase 1 was built, so the migration, seed and DB
tests were written but **not executed against a real database**. Follow these steps once.

## 1. Install PostgreSQL
1. Download the Windows installer from https://www.postgresql.org/download/windows/ (any version 14+; the report mentions 18).
2. Run it. Keep the defaults (port **5432**, include "Command Line Tools"). Set a password for the `postgres` user and remember it.
3. Open a new terminal and check:  `psql --version`

## 2. Create the databases
```
psql -U postgres -c "CREATE DATABASE msme;"
psql -U postgres -c "CREATE DATABASE msme_test;"
```
(If `msme` already exists with data, skip that line - the migration is additive and will not touch existing data.)

## 3. Configure the backend
```
cd Backend
copy .env.example .env            # then edit DB_NAME, DB_PASSWORD, JWT_SECRET
copy .env.test.example .env.test  # edit DB_PASSWORD
npm install
```

## 4. Create tables and sample data
```
npm run db:migrate    # creates missing tables/columns/indexes; never drops anything
npm run db:seed       # adds 19 UNVERIFIED placeholder schemes if not already present
```
Both can be re-run safely.

## 5. Run tests
```
npm test
```
Database tests run only if `.env.test` points at a database whose name ends in `_test`; otherwise they are skipped.

## 6. Start everything
```
npm run dev          # backend on :8000  (Backend/)
npm start            # frontend on :3000 (Frontend/)
```
