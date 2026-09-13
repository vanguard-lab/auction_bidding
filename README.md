# Auction Bidding Backend

A high-performance auction bidding backend built with Node.js, TypeScript, Express.js, and PostgreSQL. Features real-time bid processing with idempotency support and timezone-aware timestamps.

## Features

- ✅ User authentication (signup/login) with JWT tokens
- ✅ Real-time auction management
- ✅ Concurrent bid handling with idempotency
- ✅ Timezone-aware timestamps (timestamptz)
- ✅ PostgreSQL database with TypeORM
- ✅ RESTful API design
- ✅ Request validation and error handling
- ✅ Docker support for easy deployment

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- npm or yarn

## Project Structure

```
auction_biding/
├── src/
│   ├── app/
│   │   ├── application/      # Business logic (CQRS pattern)
│   │   ├── configuration/    # Environment config
│   │   └── http/            # Express routes & middleware
│   ├── infrastructure/       # Database & external services
│   ├── index.ts             # Entry point
│   ├── main.ts              # Application composition
│   └── seed.ts              # Database seeding
├── test-scripts/            # API test scripts
├── docker/
│   └── docker-compose.yml   # PostgreSQL container
└── .env                     # Environment variables
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd auction_biding
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=auction_user
DB_PASSWORD=auction_pass
DB_NAME=auction_db
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
```

### 3. Start PostgreSQL Database

```bash
docker-compose -f docker/docker-compose.yml --env-file .env up -d
```

### 4. Seed the Database

```bash
export $(cat .env | xargs) && npx ts-node src/seed.ts
```

### 5. Start the Development Server

```bash
export $(cat .env | xargs) && npm run dev
```

The server will start on `http://localhost:3000`

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/login`
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Auction Endpoints

#### GET `/api/auctions`
List all auctions (public endpoint).

**Response (200):**
```json
[
  {
    "auction_id": "uuid",
    "status": "OPEN",
    "starts_at": "2026-09-13T13:17:28.828Z",
    "ends_at": "2026-09-13T15:17:28.828Z",
    "current_top_bid": "150",
    "current_top_bidder": "uuid"
  }
]
```

#### GET `/api/auctions/:id`
Get details of a specific auction (public endpoint).

**Path Parameters:**
- `id` (string): Auction UUID

**Response (200):**
```json
{
  "auction_id": "uuid",
  "status": "OPEN",
  "starts_at": "2026-09-13T13:17:28.828Z",
  "ends_at": "2026-09-13T15:17:28.828Z",
  "current_top_bid": "150",
  "current_top_bidder": "uuid"
}
```

#### GET `/api/auctions/:id/bids`
Get all bids for a specific auction (public endpoint).

**Path Parameters:**
- `id` (string): Auction UUID

**Response (200):**
```json
[
  {
    "bid_id": "uuid",
    "auction_id": "uuid",
    "user_id": "uuid",
    "amount": "150",
    "created_at": "2026-09-13T14:17:34.361Z"
  }
]
```

#### POST `/api/bid`
Place a bid on an auction (requires authentication).

**Headers:**
- `Authorization: Bearer <token>`
- `Idempotency-Key: <unique-key>` (optional but recommended)

**Request Body:**
```json
{
  "auction_id": "uuid",
  "user_id": "uuid",
  "amount": 150.00
}
```

**Response (201):**
```json
{
  "bid_id": "uuid",
  "auction_id": "uuid",
  "user_id": "uuid",
  "amount": 150,
  "accepted": true,
  "is_top_bid": true,
  "created_at": "2026-09-13T14:17:34.361Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Bid too low or duplicate bid
- `404 Not Found` - Auction not found

#### DELETE `/api/bids/:id`
Delete a bid (requires authentication).

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string): Bid UUID

**Response (204):** No content

---

## Running Test Scripts

### 1. Full API Test Suite

Runs comprehensive API tests including signup, login, bidding, and error scenarios.

```bash
export $(cat .env | xargs) && node test-scripts/api-tests.js
```

**What it tests:**
- User signup and login
- Auction listing and retrieval
- Bid placement with authentication
- Idempotency handling
- Duplicate bid rejection
- Bid deletion
- Authorization guards

### 2. Concurrent Bid Idempotency Test

Tests that multiple simultaneous bid requests with the same idempotency key result in only one bid being created.

```bash
export $(cat .env | xargs) && node test-scripts/test-concurrent-bids.js
```

**What it tests:**
- Sends 10 concurrent bid requests with the same idempotency key
- Verifies only 1 bid is created in the database
- Confirms all successful responses return the same bid ID

### 3. Save Test Output to Log File

```bash
export $(cat .env | xargs) && node test-scripts/api-tests.js > log.txt 2>&1
```

---

## Docker Commands

### Start Database

```bash
docker-compose -f docker/docker-compose.yml --env-file .env up -d
```

### Stop Database

```bash
docker-compose -f docker/docker-compose.yml down
```

### Reset Database (Remove Volumes)

```bash
docker-compose -f docker/docker-compose.yml down -v
```

### View Database Logs

```bash
docker logs auction_postgres -f
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
export $(cat .env | xargs) && npm run dev

# Build for production
npm run build

# Start production server
npm start

# Clean build artifacts
npm run clean
```

---

## Database Schema

### Tables

#### `auctions`
- `id` (uuid, primary key)
- `status` (text) - OPEN, CLOSED, etc.
- `starts_at` (timestamptz) - Auction start time (UTC)
- `ends_at` (timestamptz) - Auction end time (UTC)
- `current_top_bid` (decimal) - Current highest bid amount
- `current_top_bidder_id` (text) - UUID of highest bidder
- `created_at` (timestamptz) - Record creation time (UTC)

#### `bids`
- `id` (uuid, primary key)
- `auction_id` (uuid, foreign key)
- `user_id` (text) - Bidder's user ID
- `amount` (decimal) - Bid amount
- `idempotency_key` (text, unique) - Prevents duplicate bids
- `created_at` (timestamptz) - Bid creation time (UTC)

#### `users`
- `id` (uuid, primary key)
- `email` (text, unique)
- `password_hash` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Note:** All timestamp columns use `timestamptz` (timestamp with time zone) for proper timezone handling. Times are stored in UTC and converted to client timezone on retrieval.

---

## Key Features Explained

### Idempotency
The API supports idempotent bid requests using the `Idempotency-Key` header. When the same key is sent multiple times, the server returns the same response without creating duplicate bids.

### Concurrency Control
Uses PostgreSQL row-level locking to handle concurrent bids safely. Only one bid can update the auction's top bid at a time.

### Timezone Handling
All timestamps use PostgreSQL's `timestamptz` type, which:
- Stores times in UTC
- Automatically converts to client's timezone on retrieval
- Prevents timezone-related bugs in auction start/end times

### Authentication
JWT-based authentication with configurable expiration. Protected endpoints require a valid `Authorization: Bearer <token>` header.

---

## Troubleshooting

### Server Won't Start
- Check if PostgreSQL is running: `docker ps`
- Verify environment variables in `.env`
- Check for port conflicts: `lsof -i :3000` or `lsof -i :5432`

### Database Connection Errors
```bash
# Restart database
docker-compose -f docker/docker-compose.yml --env-file .env restart

# Reset database completely
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml --env-file .env up -d
npx ts-node src/seed.ts
```

### Tests Fail
- Ensure server is running: `npm run dev`
- Ensure database is seeded: `npx ts-node src/seed.ts`
- Check environment variables are loaded

---

## License

MIT
