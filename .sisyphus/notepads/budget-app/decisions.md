# Decisions - Budget App

## Architecture Decisions
- Monorepo structure: client/ + server/ at root
- Root package.json with concurrently for dev
- SQLite with Sequelize ORM (sync, no migrations for greenfield)
- JWT: access in response body (localStorage), refresh in httpOnly cookie
- Zod for all input validation
- Environment: .env with DB_PATH, JWT secrets, etc.
