# Changes beyond the assignment

The assignment is the baseline. This file lists every behavior we added or changed, in the order we decided it, and how we handled it. When a later change is also outside the PDF, add a new entry here. Do not leave it only in chat.

Nothing here is an excuse to skip a required screen. Signup, login, shop list, product list, product create, export, accept, and the stored quantity move are still required.

## How an entry is written

Each entry says:

1. What the assignment asked for.
2. What we do instead.
3. Why.
4. How we handled it, including what goes wrong if two people act at the same time.

## 1. Next.js instead of Create React App

**Assignment.** React, started from the Create React App TypeScript template. The frontend runs in its own container.

**What we do.** Next.js, App Router, TypeScript. NestJS is still a separate container. Next.js does not connect to PostgreSQL.

**Why.** File routes, layouts, automatic code splitting, and prefetch stay consistent as more screens are added. Create React App does not provide that structure. The research is in [frontend-nextjs.md](frontend-nextjs.md).

**How we handled it.** We kept the assignment's three containers: Next.js, NestJS, PostgreSQL. Transfer rules stay in NestJS. A Next.js Server Action must not accept an export.

## 2. A shop table, separate from the shopkeeper

**Assignment.** The sample diagram stores name, email, password, address, and image on the shopkeeper. Products point at the shopkeeper. It also says each shopkeeper has only one shop, and the schema may be improved.

**What we do.** Shopkeeper holds the login. Shop holds the stall name, address, and optional image. One shopkeeper row owns exactly one shop row.

**Why.** The home page shows a shop, not a person's password. The person's name and the stall's name are different.

**How we handled it.** `shop.shopkeeper_id` is unique. Signup writes both rows in one transaction. If the shop insert fails, the shopkeeper insert is rolled back too. Two signups with the same email cannot both succeed, because email is unique. The second insert fails and the whole signup transaction rolls back.

## 3. A public transfer board instead of a pre-chosen target shop

**Assignment.** The shopkeeper creates an export that already names the target shop. The receiver accepts. The sample Trade row has no "still waiting" status.

**What we do.** The sender publishes a pending request with no destination. Every other shopkeeper sees those pending rows on one list and compares them. The shopkeeper who accepts is stored as the destination.

**Why.** A request aimed at one shop never appears for the others, so they cannot compare it. The completed row still stores source and target, which is what the assignment wanted recorded. The target is filled at accept time instead of create time.

**How we handled it.** Pending rows stay in `transfer_requests` and are listed by the `open_transfer_board` view. Logout does not delete them. There is no session table. `accept_transfer_request` does not ask whether the sender is logged in. The source shop cannot accept its own row. The functions live in the Prisma migration [backend/prisma/migrations/20261007063300_init/migration.sql](../backend/prisma/migrations/20261007063300_init/migration.sql).

## 4. A price on the transfer

**Assignment.** No price field. The story is about moving unsold goods, not about selling them between shops.

**What we do.** Each transfer request stores `unit_price`, the price of one unit. The screen also shows quantity times unit price as the total. The product row does not gain a price. The same product can be offered later at another price.

**Why.** Shopkeepers compare requests with each other. Quantity alone does not make two offers comparable.

**How we handled it.** Unit price must be greater than zero. It is saved when the request is created and the database rejects a later change of that price only by not offering an update function. `total_price` is a stored generated column, `quantity * unit_price`, so the sender and the buyer read the same total. The column is on `transfer_requests` in the Prisma migration [backend/prisma/migrations/20261007063300_init/migration.sql](../backend/prisma/migrations/20261007063300_init/migration.sql). The product row does not have a price. A different asking price is a different request.

## 5. Quantity reserved by pending requests

**Assignment.** The quantity check is only described at the moment of transfer: do not move more than the source shop has.

**What we do.** While a request is pending, its quantity is reserved. The shelf number does not drop until accept. New pending quantities for that product, added together, cannot exceed the shelf.

**Why.** Otherwise Ravi can publish 20 and also publish another 20 from a shelf of 20. Both rows would sit on the board. Only one could be honored.

**How we handled it.** Creating a request locks that product row, adds up the pending quantities, and inserts only if the new total still fits. The lock makes two creates at the same moment run one after the other. The second sees the first reservation. Details are in the concurrent cases.

## 6. Concurrent actions on one transfer

**Assignment.** Accept moves the quantity and stores the transfer. It does not describe two shopkeepers accepting together. Our public board makes that normal: many people can see the same pending row.

**What we do.** Every create, accept, cancel, and stock edit for a product runs in one database transaction. The product row is locked first. The request row is locked second. Always that order, so two transactions cannot lock the same rows in opposite orders and wait on each other forever.

The accept itself is one update: set this request to accepted, and set the destination shop, only where the id matches and the status is still pending. If that update changes zero rows, this caller lost. The transaction stops and changes no quantities.

### Two shopkeepers accept the same request

Meera and Ali both see Ravi's rice, still pending. Both press Accept.

PostgreSQL lets one update change the row from pending to accepted. That transaction then lowers Ravi's quantity and raises the winner's quantity. The other update matches zero rows because the status is no longer pending. That caller gets a conflict response. Their screen reloads the board. The rice is no longer listed as pending.

Disabling the button after the first click does not fix this. Both clicks can leave the browser before either response returns.

### The same shopkeeper clicks Accept twice

Same rule. The second click changes zero rows. One transfer is stored.

### Two publishes that together exceed the shelf

Ravi has 20. Two requests of 15 are submitted together. Both would pass if they each read "nothing reserved yet."

The first transaction locks the product, sees 0 reserved, inserts 15. The second waits on that lock, then sees 15 already reserved, and refuses because 15 + 15 is more than 20.

### Someone accepts while another request is being published

Accept locks the product, then the request. It reduces the shelf only after it has won the status update. A publish that started at the same time waits for the product lock, then checks the reserved total against the new shelf. It cannot reserve units the accept already removed.

### The sender lowers the shelf under the reserved amount

Ravi has a pending request for 10 and edits the product quantity to 2.

The edit locks the product, sums pending quantities, and refuses the edit. The pending offer stays valid. The same lock blocks deleting a product that still has a pending request.

### Cancel and accept together

Cancel updates the row only where status is still pending. Accept does the same. One of them changes one row. The other changes zero rows. Cancel does not move stock. Accept does. They cannot both happen.

### The board is stale

The list can still show a request after someone else has accepted it. The next accept call hits the zero-row update and the page shows that the offer is gone. We do not cache "still pending" in front of this check. A cached pending row would let two shops both think they won.

### Two winners creating the same product name at the destination

`accept_transfer_request` always inserts a new product row on the accepting shop. It does not look up an existing product by name and add to it. Two accepts of two different requests can both insert a row named Rice. They do not race on "find Rice, then insert Rice." The destination shelf can show two Rice lines. That choice is recorded in [database.md](database.md).

## 7. Rejected and cancelled

**Assignment.** Create and accept. No decline and no withdraw.

**What we do.** `cancel_transfer_request` sets a pending row to `cancelled` and frees the reserved quantity. A private offer can also be set to `rejected` by the invited shop. A public offer still cannot.

**Why.** A board with only pending and accepted cannot record "the sender took it back" without deleting the row. Deleting destroys the history.

**How we handled it.** Cancel updates the row only where status is still pending, in the same lock order as accept. One of them changes one row. The other changes zero rows. Cancel does not move stock. `reject_transfer_request` uses that same lock and the same pending check. It does not move stock either.

## 8. Bidding with a counter-price

**Assignment.** Not mentioned.

**What we do.** Not built. [scalability.md](scalability.md) describes a later Bid row on the existing request. The sender's unit price remains what shopkeepers compare today. A bid would let another shop name a different unit price.

**Why.** The public board and the price were enough for comparison. Counter-offers are a second workflow.

**How we handled it.** No Bid table in the first design. If it is added later, the winning bid fills `destination_shop_id` and uses the same accept transaction. Bids must not change shelf quantities by themselves. This file gets a new entry at that time.

## 9. Prisma as the ORM

**Assignment.** Use one of Sequelize, TypeORM, or Prisma.

**What we do.** Prisma 7.10. The comparison is in [orm.md](orm.md). Sequelize was not compared. Prisma 8 was a release candidate, so it was not installed. There is no second SQL folder.

**Why.** One schema file for the four tables. The assignment lists Prisma. The accept race stays in the SQL functions, which a normal Prisma update does not replace.

**How we handled it.** [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) describes the tables for TypeScript. It is not a translation of every database rule. [backend/prisma/migrations/20261007063300_init/migration.sql](../backend/prisma/migrations/20261007063300_init/migration.sql) is the script PostgreSQL ran, including checks, the board view, triggers, and the three functions. `prisma migrate deploy` applied that script to an empty database. Later table changes are new Prisma migrations. Accept still calls `accept_transfer_request()`.

## 10. PostgreSQL container now, application containers last

**Assignment.** Frontend, backend, and PostgreSQL are all containerized.

**What we do.** [docker-compose.yml](../docker-compose.yml) starts PostgreSQL 16 only. Next.js and NestJS containers are added when those apps exist, at the last stage.

**Why.** The schema can be loaded and checked before either application is written. Building empty frontend and backend images now would not serve a request.

**How we handled it.** The database password is `POSTGRES_PASSWORD` in `.env`, which is not committed. `.env.example` lists the variable names. A named volume keeps the data if the container is recreated. That volume is not a backup. Postgres starts empty. Prisma applies the schema. The container does not load a SQL file on its own.

## 11. Things we did not add

These came up and were left out. They are listed so a later chat does not treat them as decided.

| Idea | Assignment | Handling |
|---|---|---|
| Expiry dates | The story says goods may expire. No field is required. | No column. A later column is a migration and a new entry here. |
| Market table | "A market" is the whole app. | No table. All shops are in this database. |
| Sales history | Not requested. | No table. Comparing transfer prices does not require past sales. |
| Queues, caches, extra services | Not requested. | Refused for the first version. See [scalability.md](scalability.md). |
| Password stored as plain text | The sample field is named password. The written API notes say to store it securely. | We store `password_hash` only. |
