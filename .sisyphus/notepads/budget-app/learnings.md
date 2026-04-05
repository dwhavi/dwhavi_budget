# Learnings - Budget App

## Project Context
- Greenfield project: React + Express + SQLite 가계부 웹 앱
- Korean language interface (hardcoded, no i18n)
- Tech stack: React 18 + Vite + TypeScript, Express + TypeScript, SQLite + Sequelize, Tailwind CSS + Recharts
- Auth: JWT (access 15m + refresh 7d via httpOnly cookie)
- Testing: Vitest (TDD approach), supertest for API tests, React Testing Library for components
- No state management libs (React Context + hooks only)
- No CSS-in-JS (Tailwind only)
- Mobile-first with bottom tab bar, desktop sidebar

## Key Spec Notes
- First registered user gets admin role
- Auto-create "현금" PaymentMethod on registration
- PaymentMethod type ENUM includes 'transfer' (credit, debit, cash, transfer)
- RecurringExpense: start_date/end_date (no payment_day, no auto-registration)
- Soft delete on: Category, Transaction, PaymentMethod, RecurringExpense (deleted_at field)
- Amount validation: 1 ~ 99,999,999 (INTEGER)
- Category type validation: income→income, expense→expense
- SubCategories: autocomplete from user's previous entries, frequency-ranked

## API Response Format
- Success: { "success": true, "data": { ... } }
- Error: { "success": false, "message": "에러 메시지" }

## Vitest Testing Infrastructure Setup
- Created vitest.config.ts for server (node environment) with globals: true
- Created vitest.config.ts for client (jsdom environment) with React plugin and @ alias
- Added test scripts to both package.json files: "test": "vitest run" and "test:watch": "vitest"
- Created basic test setup with @testing-library/jest-dom import for client
- Added smoke tests in both server/src/__tests__/smoke.test.ts and client/src/test/smoke.test.ts
- Both test suites pass successfully, confirming proper Vitest configuration

## Sequelize Models (6 models created)
- Models: User, Category, Transaction, PaymentMethod, Budget, RecurringExpense
- All models use `underscored: true` with explicit `created_at`/`updated_at` in both attributes and init
- Sequelize define options use camelCase keys: `createdAt: 'created_at'`, `updatedAt: 'updated_at'` (not snake_case)
- TS requires `created_at`/`updated_at` fields explicitly in `Model.init()` to satisfy type checking
- ModelRegistry type uses `typeof import('./X.js').X` (not instance type) since db holds model classes
- Dynamic `await import()` in `loadModels()` avoids circular dependency issues
- Associations set up after all models loaded in `setupAssociations()`
- Budget has unique composite index on (user_id, category_id, month)
- Category.user_id is nullable (null = global category)
- PaymentMethod.payment_method_id on Transaction and RecurringExpense is nullable
- No paranoid: true — deleted_at handled manually in queries
- 12 default seed categories (3 income + 9 expense), all user_id: null
- Seeder is idempotent: checks existing count before seeding
- Imports use `.js` extensions (tsx resolves them for CommonJS)
- Pre-existing smoke.test.ts TS error: vitest globals not recognized by tsc (vitest config has globals:true but tsconfig doesn't reference vitest types)

## Test Isolation Solution
- Problem: 63 tests passed individually but failed when run together due to shared SQLite database state
- Solution: Vitest pool isolation with in-memory SQLite databases
- Key changes:
  1. Modified `models/index.ts` to handle `:memory:` storage path properly (bypass path.resolve for in-memory DB)
  2. Added `sequelize.sync()` to `setupApp()` to ensure tables are created for tests
  3. Removed duplicate `sequelize.sync()` from `startServer()` since it's now in setupApp
  4. Guarded `startServer()` call with `!process.env.VITEST` to prevent server startup in test environment
  5. Created `__tests__/setup.ts` to set `DB_PATH=:memory:` and test JWT secrets
  6. Updated `vitest.config.ts` with `pool: 'forks'` for complete process isolation and `setupFiles` for environment setup
- Result: Each test file runs in its own process with separate in-memory SQLite database, eliminating shared state issues
- Architecture insight: Routes import `db` from `models/index.js` - with fork isolation, each test gets its own sequelize/db instances