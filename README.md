# NestJS Boilerplate

A production-ready NestJS starter with JWT authentication, API key + CSRF protection, and modular architecture.

## Features

- ✅ JWT Auth (`register`, `login`, `refresh-token`, `me`)
- ✅ Custom security decorators (`@Public`, `@Guest`)
- ✅ API Security (`x-api-key`, CSRF token, bearer auth)
- ✅ TypeORM + MySQL
- ✅ Reusable module/feature structure under `src/api`
- ✅ File/Upload APIs
- ✅ Logs API
- ✅ Database Seeding CLI (`pnpm seed`)
- ✅ Runtime Environment variable validation
- ✅ Swagger (non-production)
- ✅ Project init CLI (`pnpm init:project`)

## Getting Started

### 1. Clone

```bash
git clone https://github.com/emravoan/nestjs-boilerplate.git
cd nestjs-boilerplate
```

### 2. Install

```bash
pnpm install
```

### 3. Setup `.env`

Recommended:

```bash
pnpm init:project
```

Manual example:

```env
NODE_ENV=development
PORT=3000

API_PREFIX=api
API_VERSION=v1
API_KEY=replace_with_secure_api_key

JWT_SECRET=replace_with_secure_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

CSRF_SECRET=replace_with_secure_csrf_secret

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=nestjs_boilerplate
DB_USERNAME=app
DB_PASSWORD=app
```

### 4. Run

```bash
pnpm start:dev
```

API base URL: `http://localhost:3000/api/v1`
Swagger URL: `http://localhost:3000/swagger` (non-production only)

## Custom Decorators

- `@Public()`: Bypasses all global guards (no API key and no JWT required). Used on public routes (e.g. `/health`).
- `@Guest()`: Bypasses JWT validation but still requires a valid `x-api-key` header. Used on guest routes (e.g. `/auth/login`, `/auth/register`).

## Docker (App + MySQL)

```bash
pnpm init:project --yes
docker compose -f docker-compose.yml up --build
```

## Seeding & Migration Workflow

### Seed database with initial data (e.g. Default Admin User)
```bash
pnpm seed
```

### Run database migrations
```bash
pnpm migration:generate
pnpm migration:show
pnpm migration:run
```

## Scripts

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `pnpm init:project`       | Generate `.env` + `docker-compose.yml` with secure secrets |
| `pnpm seed`               | Seed the database with initial records                     |
| `pnpm start:dev`          | Run in watch mode                                          |
| `pnpm build`              | Build the project                                          |
| `pnpm start:prod`         | Run built app                                              |
| `pnpm lint`               | Lint and auto-fix                                          |
| `pnpm test`               | Run unit tests                                             |
| `pnpm test:e2e`           | Run e2e tests                                              |
| `pnpm migration:generate` | Generate a migration from entity changes                   |
| `pnpm migration:run`      | Run pending migrations                                     |
| `pnpm migration:revert`   | Revert last migration                                      |
| `pnpm gen:secret`         | Generate random hex secret                                 |
