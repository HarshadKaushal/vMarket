# Scalability and future features

This note is for a reviewer. It describes how the current design can take more shops and more requests, and which future feature we are deliberately not building yet.

Nothing in this file is a table, endpoint, or service in the current version. The database in [database.md](database.md) stays four tables. Bidding is recorded here so a later change does not invent a second way to move stock.

## What “scale” means for VMarket

Two different pressures show up as the market grows.

**More screens and more developers.** Next.js and NestJS were chosen so a new page or a new API module follows a folder that already exists. That is documented in [frontend-nextjs.md](frontend-nextjs.md) and [backend-nestjs.md](backend-nestjs.md). It does not make PostgreSQL faster.

**More shops using the system at once.** The home page lists every shop. A shop lists its products. Accepting an export updates two quantities and one request, and two shopkeepers may press accept together. The limit that matters is that write, not how fast the homepage can be redrawn.

The running shape is already split so those two pressures can be handled separately:

```text
Browser
  -> Next.js          more copies, no database password
  -> NestJS           more copies, no stock rule in the browser
  -> PostgreSQL       one database, transactions and indexes
```

Next.js and NestJS do not keep the transfer in memory. A second API container can accept an export without talking to the first one. Both talk to PostgreSQL. The database decides which accept wins.

## What the current version already allows

| Pressure | What we rely on | What we do not add yet |
|---|---|---|
| More shopkeepers loading lists | Stateless Next.js and NestJS containers. A later deploy can run more than one of each. | A load balancer, a cache, or a second read-only database. One market does not need them on day one. |
| Long shop and product lists | The API must return a page of rows, not every product in the market. | That paging is part of the list endpoints when they are built. It is not a new service. |
| Two accepts of one request | One transaction: update the request only if it is still pending, then change quantities. The second update changes zero rows. | A queue. The transaction is the lock. A queue would only move the same rule into another process. |
| Comparing open transfer requests | Pending rows are listed for every shop except the sender, with unit price and total. An index on status supports that list. | A private request aimed at one shop. That would hide the offer from the shopkeepers who need to compare it. |
| Finding a shop’s products | An index on `product.shop_id`. | A copy of the catalog in Redis. |
| Login on every request | The API checks the caller on each protected call. Containers stay replaceable. | Sticky sessions. If we later choose a server-side session store, that store has to be shared. JWT avoids that. Auth is still an open decision. |

Docker Compose currently starts PostgreSQL only. The final file will start one frontend, one backend, and one PostgreSQL so the assignment can be run and explained. That file is not a claim that production is a single API process forever. Extra API copies are a deploy change, not a schema change, because no transfer state lives in NestJS.

## What we refused to build early

A reviewer should not expect these in the first version:

- Microservices. Shops, products, and transfers are one transaction. Splitting them into services would make the accept path a network call that can half-finish.
- A message queue. Nothing needs to happen after the HTTP response except work that belongs inside the accept transaction.
- A cache of export status. A cached “still pending” page is how two shops both believe they received the goods.
- A market-wide product catalog. Each product row is one shop’s shelf. Accept inserts a new product row on the destination shop. It does not add quantity onto a same-named product.
- Bidding tables, meaning counter-offers. The priced public request is already the current design in [database.md](database.md). A later bid would let another shop name its own amount instead of taking the sender's unit price. Those tables stay out of the first migration.

## Future feature: bidding against a priced transfer

### The flow we are building

Shop A publishes a quantity and a unit price. Every other shop sees that row on one list and can compare it with the other pending rows. One shop accepts. That shop is stored as the destination, and the stock moves at the published price.

### The later flow

Other shops answer the same request with their own amount instead of only accepting or ignoring the listed price. One bid wins. The stock movement is still the accept transaction.

The published request is already the offer. A bid would be a new row attached to that request, not a second listing.

| Future table | What a row means |
|---|---|
| Bid | One shop names the quantity it wants and the unit price it is willing to pay, instead of taking the sender's price. Status is active, withdrawn, won, or lost. |

### Why this does not change today’s tables

Today’s request is already visible to the other shops, and `destination_shop_id` stays empty until one of them accepts. The sender's unit price is what they compare. Bidding does not replace that column. A bid row would hang off the existing request and, if it wins, fill the same destination and run the same quantity update.

When bidding is built, the winner still ends in the transfer request:

```text
TRANSFER_REQUEST (pending, sender's unit price, no destination)
  -> many Bids, each with its own unit price
  -> one winning Bid
  -> same TRANSFER_REQUEST, destination filled, stock moved
```

Stock still changes in one place: the accept transaction on `TRANSFER_REQUEST`, `PRODUCT` on the source shop, and `PRODUCT` on the destination shop. Bids never increment a quantity by themselves. If they did, a withdrawn bid and a completed transfer could both change the shelf.

The source product stays locked from double use the same way a pending request does. Pending quantities for a product cannot add up to more than the shelf. That check is already a rule on the current request. Bidding must use it too.

### The race bidding adds

Two shops can bid at the last moment, and two requests can try to close the same offer.

The close is the same pattern as accept:

1. Update the offer only if it is still open.
2. If zero rows change, someone else already closed it.
3. Mark one bid as won and the others as lost.
4. Insert the transfer request and move the stock in that same transaction.

Until that transaction commits, the source quantity is unchanged. A failed close leaves the offer open and the shelf untouched.

Indexes for that feature, added with the feature and not before:

- Bids by offer id, so listing bids is not a full table scan.
- Open offers by source shop, so a shopkeeper sees what they published.
- One unique “winning bid” per offer, so two winners cannot be stored.

### What bidding does not require

- A new database. PostgreSQL already serializes the close through row locks.
- A new backend service. NestJS gains an offers module and a bids module. The export service still performs the quantity update.
- A change to Next.js’s data boundary. The UI gains an offer page and a bid form. The browser still does not decide the winner.
- Real-time updates. Polling or a later notification is enough. A websocket layer is optional product work, not a scaling prerequisite.
- Payment processing. If “amount” later means money, payment is a separate decision. The stock move must not wait on a payment integration that does not exist.

## How a reviewer can check this

| Claim | Where it is true today | Where it is only a plan |
|---|---|---|
| UI and API can be scaled by running more copies | Containers hold no transfer state. [docker.md](docker.md) | Compose currently starts PostgreSQL only. The app containers come later. |
| Two accepts cannot both move stock | `accept_transfer_request` in the Prisma migration. The rule is also in [database.md](database.md). | The NestJS route that calls that function does not exist yet. |
| Lists will not load the whole market | Required by this note | Endpoints do not exist yet. |
| Bidding reuses the transfer | This file | No Offer or Bid table in the ER diagram. |

If bidding is approved later, update [database.md](database.md) with the new tables and point the quantity change at the existing transfer transaction. Do not add those tables in the first migration.
