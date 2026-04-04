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
