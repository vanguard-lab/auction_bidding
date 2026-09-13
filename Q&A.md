# Auction Bidding — Reviewer Q&A

### 1. Your data model and why you structured it that way

**Structure:** `Auction`, `Bid`, and `User` are separate entities. The application uses Clean Architecture with domain models, use cases, repositories, and HTTP controllers.

The separation keeps **business rules independent from the database and Express layer**. This makes the auction logic easier to test and change without coupling it to TypeORM or HTTP concerns.

---

### 2. How you handled the auction-close boundary case

**Decision:** A bid at exactly `ends_at` is accepted; anything after `ends_at` is rejected.

**How:**
The application checks whether the auction is open, and the database performs the same check during the conditional `UPDATE`.

**Why:**
The application check alone is not sufficient because the auction could close **between the read and the write**. The database-level condition makes the final bid update atomic and protects the close boundary from race conditions.

---

### 3. How you handled duplicate / retried bid requests

**Decision:** Bid requests are idempotent through an `Idempotency-Key`.

**How:**
The application first checks for an existing key, while the database enforces a `UNIQUE` constraint. If concurrent requests use the same key, only one can create the bid.

**Why:**
Clients can retry requests because of network failures or timeouts. Without idempotency, the same logical bid could be persisted multiple times. The database constraint provides the final guarantee even when requests arrive concurrently.

---

### 4. What did you decide for a user bidding on their own current top bid, and why?

**Decision:** The current implementation allows it.

If User A is currently winning at `$100`, User A can bid `$150` and remain the top bidder.

**Why:**
The assignment does not explicitly define self-outbidding as invalid, so the implementation currently treats a bid simply as valid when it is higher than the current top bid.

**Production change:** I would prevent self-outbidding because it provides no competitive value and can artificially increase the auction price.

---

### 5. One part of the assignment that is wrong, underspecified, or would cause a problem in production

There are four areas I would address before production. These were intentionally kept out or simplified because of the assignment's time constraint.

**1. No backend rate limiting / throttling**

Client-side debouncing/throttling can reduce unnecessary requests, but it cannot be trusted because clients can bypass it.

I would add **backend rate limiting**, scoped appropriately by user/IP, to prevent request flooding and resource exhaustion on the bid endpoint.

**2. No minimum bid increment**

The current implementation only requires the new bid to be higher than the current bid.

I deliberately left minimum-increment validation out because **the assignment does not specify what the minimum increment should be**. Adding an arbitrary value would introduce an undefined business rule.

In production, the minimum increment should be an explicit auction rule.

**3. Application server time is used for the auction boundary**

The current check uses `new Date()` from the application server. In a distributed environment, clock differences between servers can create inconsistencies around the exact auction-close boundary.

I would use **database time (`NOW()`) for the final database-level check**, giving the transaction a single authoritative time source.

**4. Idempotency-Key is not cached at the application/Redis layer**

The current implementation relies on the **database-level unique constraint as the final idempotency guarantee**. This correctly prevents duplicate persistence, but every retry still reaches the application/database path.

A production flow would be:

`Application-level check → Redis idempotency cache → DB unique constraint/final check`

The application layer can handle fast duplicate detection, Redis can prevent repeated processing across application instances, and the **database remains the final source of truth** for concurrency and uniqueness.

I deliberately did not add Redis because it was outside the practical time constraint of the assignment. The database-level protection is the part that was prioritized because it provides the correctness guarantee even when concurrent requests bypass the application/Redis layer.

