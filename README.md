# SupplyChain UZ — B2B Supply Management Platform

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone & setup env
```bash
cp .env.example .env
# Edit .env — set your JWT secrets at minimum
```

### 2. Start infrastructure (Postgres + Redis)
```bash
docker compose up postgres redis -d
```

### 3. Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed          # creates test accounts
npm run dev                  # runs on http://localhost:4000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                  # runs on http://localhost:3000
```

### Production (full Docker)
```bash
docker compose up --build
```

---

## Test Accounts (after seed)

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `Admin@1234` |
| Supplier Admin | `supplier_admin` | `Supplier@1234` |
| Market Admin | `market_admin` | `Market@1234` |

---

## API Base URL
`http://localhost:4000/api/v1`

## Key Endpoints
- `POST /auth/login` — login
- `GET  /orders` — list orders (role-scoped)
- `POST /orders/:id/submit` — market submits order
- `POST /orders/:id/confirm` — supplier confirms
- `POST /orders/:id/dispatch` — supplier dispatches
- `POST /orders/:id/deliver` — market confirms delivery
- `GET  /admin/audit-logs` — full audit trail
- `GET  /admin/dashboard` — platform stats

---

## Architecture
See `ARCHITECTURE.md` for full system design.

## Phase Roadmap
- **Phase 1** ✅ Core order flow (this release)
- **Phase 2** Admin panel + reports UI
- **Phase 3** SMS OTP live + document management UI
- **Phase 4** Analytics + CSV export
- **Phase 5** Production deployment + security audit

---

## One-time fix after copying project

One directory was accidentally created as a folder instead of a file. Fix it with:

```bash
cd frontend/src/app/supplier
rm -rf layout.tsx
mv RENAME_ME_layout.tsx layout.tsx
```

Then run normally.
