# 3a3e0ac — docs: name the concurrency case inside each transfer query

## What the commit contains

Comments inside the four `Prisma.sql` strings in `transfers.service.ts`:

- publish: two offers that together exceed the shelf; the function locks the product; the second waits and can get 409
- list: a read of `open_transfer_board`; no lock; an uncommitted accept is still visible
- accept: two accepts, or accept against cancel; lock product then request; the loser gets "no longer pending"
- cancel: only the source shop; same first lock; no stock movement; 409 if accept already committed

## Review

The comments do not change the SQL sent to PostgreSQL. Parameter placeholders are unchanged. The migration was not edited.

## Decision

Teach the race next to the call site. Keep the lock and the status check in the functions, where a second request cannot skip them.
