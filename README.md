# Kinman Backend

NestJS-based REST API for expense tracking and group bill splitting with real-time updates.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- pnpm (recommended package manager)

### Installation

1. Install pnpm globally (if not already installed):
```bash
npm install -g pnpm
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment:

Create `config/config.yml` from `config/default.yml` and update with your settings:
```yaml
app:
  port: 3000

database:
  host: localhost
  port: 5432
  username: postgres
  password: your_password
  database: kinman

jwt:
  secret: your-secret-key
  expiresIn: 3600
```

### Development

Start development server with hot-reload:
```bash
pnpm start:dev
```

Start production mode:
```bash
pnpm start
```

The API will be available at `http://localhost:3000/api`

### Build for Production

Build the application:
```bash
pnpm build
```

Run production build:
```bash
pnpm start:prod
```

## 📦 Features

- 🔐 JWT authentication with refresh tokens
- 💰 Transaction management (CRUD)
- 🏷️ Categories and wallets
- 👥 Group expense splitting
- 📊 Reports and analytics
- 🔔 Notifications system
- ⚡ Real-time updates via Socket.IO
- 📝 TypeORM for database operations
- 🔄 Auto-migration on startup

## 🛠 Tech Stack

- NestJS 11
- TypeScript
- TypeORM with PostgreSQL
- Socket.IO for WebSocket
- JWT for authentication
- class-validator for validation
- Swagger for API documentation

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api-docs`

## 🗂️ Project Structure

```
src/
├── common/          # Shared utilities, decorators, filters
├── configs/         # Configuration files
├── modules/
│   ├── auth/        # Authentication & authorization
│   ├── finance/     # Transactions, categories, wallets, groups
│   ├── reports/     # Analytics and reporting
│   ├── realtime/    # WebSocket gateway
│   └── notification/# Notification system
├── app.module.ts
└── main.ts
```

## 🔧 Available Scripts

```bash
# Development
pnpm start:dev      # Start with hot-reload
pnpm start:debug    # Start with debugging

# Production
pnpm build          # Build the project
pnpm start:prod     # Run production build

# Testing
pnpm test           # Run unit tests
pnpm test:e2e       # Run e2e tests
pnpm test:cov       # Generate coverage report

# Linting
pnpm lint           # Run ESLint
pnpm format         # Format code with Prettier
```
