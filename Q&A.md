# Auction Bidding Backend

Node.js + TypeScript + Express + PostgreSQL auction backend with JWT auth, concurrent bid handling, idempotency, and timezone-safe timestamps.

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure `.env`

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=auction_user
DB_PASSWORD=auction_pass
DB_NAME=auction_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
```

### 3. Start PostgreSQL

```bash
docker-compose -f docker/docker-compose.yml --env-file .env up -d
```

### 4. Seed Database

```bash
export $(cat .env | xargs) && npx ts-node src/seed.ts
```

### 5. Start Server

```bash
export $(cat .env | xargs) && npm run dev
```

Server: `http://localhost:3000`

---

## API

### Auth

```http
POST /api/auth/signup
POST /api/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Both return a JWT `access_token`.

### Auctions

```http
GET /api/auctions
GET /api/auctions/:id
GET /api/auctions/:id/bids
```

### Bidding

```http
POST /api/bid
DELETE /api/bids/:id
```

Place a bid with:

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
```

```json
{
  "auction_id": "uuid",
  "user_id": "uuid",
  "amount": 150
}
```

---

## Tests

### Full API Suite

```bash
export $(cat .env | xargs) && node test-scripts/api-tests.js
```

Covers auth, auctions, bidding, idempotency, duplicate bids, deletion, and authorization.

### Concurrent Bid Test

```bash
export $(cat .env | xargs) && node test-scripts/test-concurrent-bids.js
```

Sends 10 concurrent requests with the same idempotency key and verifies only one bid is created.

---

## Where to Explore

```text
src/
├── app/
│   ├── application/      # Business logic / CQRS
│   ├── configuration/    # Environment configuration
│   └── http/             # Express routes & middleware
├── infrastructure/       # PostgreSQL / TypeORM
├── main.ts               # Application composition
├── index.ts              # Entry point
└── seed.ts               # Database seed

test-scripts/             # API and concurrency tests
docker/                   # PostgreSQL setup
```

### Main areas to review

* **Auth** → `src/app/application/` + auth HTTP routes
* **Auction/Bid flow** → `src/app/application/`
* **Concurrency** → bid application logic + PostgreSQL transaction/locking
* **Idempotency** → bid flow + database constraint
* **Timezone handling** → entity/database timestamp definitions
* **API layer** → `src/app/http/`
* **Database** → `src/infrastructure/`

---

## Core Design Points

* JWT authentication
* PostgreSQL `timestamptz` for UTC-safe timestamps
* PostgreSQL row-level locking for concurrent bids
* `Idempotency-Key` support for duplicate requests
* Database-level uniqueness as the final idempotency safeguard
* TypeORM for persistence
* Request validation and authorization guards

## Reset Database

```bash
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml --env-file .env up -d
export $(cat .env | xargs) && npx ts-node src/seed.ts
```
