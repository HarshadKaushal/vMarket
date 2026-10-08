# Database design

## Decision record

### Context

PostgreSQL is required. The assignment's sample diagram has Shopkeeper, Product, and Trade, and it says the schema may be improved. The home page lists shops. A shopkeeper has exactly one shop. Products have a name, description, and quantity. An export names a product and a quantity. The sender also sets a price for that transfer. The request is shown to the other shopkeepers so they can compare open requests. One of them accepts, and that shop becomes the target. Accepting moves the quantity and must be stored as a database operation. The assignment text names the target at creation time. We record the target when someone accepts, because a request aimed at one shop cannot be compared by the others.

### Problem

Design tables that can represent a request before anyone accepts it, and a completed move after they do, without storing the same fact in two contradictory places.

### Options considered

**The sample diagram.** Product belongs to a shopkeeper. Trade stores exported-by, imported-by, quantity, and product id. There is no status, so a request that is still waiting cannot be distinguished from a finished transfer. Address and image sit on the person, while the home page shows a shop.

**Shopkeeper and shop collapsed into one table.** Allowed by "one shopkeeper, one shop," and closer to the sample. The person's name and the stall's name become the same column. The home page wants a shop name, an address, and an optional image.

**Separate Shopkeeper and Shop, plus Product, plus one Transfer request table.** The person logs in. The shop is what the market sees. The product sits on a shop. The request exists while it is pending and remains after accept as the history.

**A request table plus a separate completed-transfer table.** Clearer audit, and more than the assignment needs, because accept and the stock movement are one operation.

### Decision

Use four tables: **Shopkeeper**, **Shop**, **Product**, and **Transfer request**.

This design is applied. Prisma's schema file lists the tables for TypeScript. The SQL migration is what PostgreSQL ran. Accept always inserts a new product row on the destination shop. Cancel is a database function. `rejected` is a status value, and no function sets it yet.

### Reasons

- Signup has to create an account and a shop. Those are different facts: email and password versus shop name, address, and image.
- One shopkeeper, one shop is enforced by a unique `shopkeeper_id` on Shop, not by hoping the application remembers.
- A product quantity belongs to a shelf. Ravi's rice and Meera's rice are two rows. A transfer does not point one product row at two shops.
- A trade row with no status cannot sit on a shared board. The request is inserted as `pending`, with a unit price and no destination. It is updated to `accepted` only when another shop takes it, in the same transaction as the quantity change.
- The request row is kept, so the assignment's "store the transfer" rule is satisfied without a fifth table.
- `created_by` and `accepted_by` were left off. The source shop has one owner and the destination shop has one owner. Copying those people onto the request would allow a row whose creator does not own the source shop.

### Trade-offs

- Accept does not look for an existing product with the same name. The destination shelf can show two rice rows. That is the cost of not racing two accepts on one name.
- `rejected` and `cancelled` are not required by the PDF. Cancel is implemented, so a sender can take a pending offer back without deleting the row. `rejected` is only a value in the status list until a screen needs it.
- Expiry is the business story and is not a column. No screen records it. Adding it later is a migration, not a silent redesign.
- There is no Market table. Every shop in this database is in the one market the app serves.

### Consequences

- Signup inserts Shopkeeper and Shop in one transaction.
- Creating a request does not move stock and does not name a receiver. It stores quantity and unit price and leaves the row `pending`.
- Every other shopkeeper loads those pending rows and can compare them. The sender sees their own row as outgoing and cannot accept it.
- The SQL for this design is the Prisma migration [backend/prisma/migrations/20261007063300_init/migration.sql](../backend/prisma/migrations/20261007063300_init/migration.sql). `create_transfer_request`, `accept_transfer_request`, and `cancel_transfer_request` are the writes. The checks run inside PostgreSQL, so a logged-out sender is not part of the decision. [schema.prisma](../backend/prisma/schema.prisma) names the same four tables for Prisma Client. It does not contain those functions. The difference is in [orm.md](orm.md).
- Accept updates the request only if it is still pending, sets the accepting shop as destination, inserts a new product row on that shop for the moved quantity, and lowers the source quantity in that same transaction.
- `unit_price` is stored on the request. `total_price` is quantity times that price, computed by the database so both shops read one number.
- A product with a pending request cannot be deleted, and its quantity cannot be edited below the pending total.
- A later change to the tables has to update this diagram and add a new Prisma migration. The init SQL that already ran is not edited.

## Technology note

1. **What it is.** PostgreSQL is the relational database. The design is the four tables and the foreign keys between them.
2. **What problem it solves.** It stores the market's shops, stock, and transfers, and it can commit or roll back the accept writes together.
3. **What alternatives exist.** The sample three-entity diagram, a single shopkeeper/shop table, and a separate history table for completed transfers.
4. **What VMarket requires.** Shop listing, per-shop products, one shop per shopkeeper, export, accept, and a stored quantity movement.
5. **Why it was selected.** The sample cannot represent a pending request or a shop distinct from a person. The four-table model can, without a market, expiry, or sales-history system the screens do not use.
6. **What trade-offs it introduces.** Destination stock is always a new product row, so the same name can appear twice on one shelf. Cancel is stored. `rejected` is unused.

## Brainstorm

We started from the required screens, not from a generic inventory model.

| Requirement | What it forced |
|---|---|
| Shopkeeper signup and login | A person table with email and a password hash. |
| Home page: shop name, address, optional image | A shop table. Those fields are not the person's name and password. |
| Each shopkeeper has only one shop | `shop.shopkeeper_id` is unique and required. |
| Products have name, description, quantity | A product row, not a market-wide catalog. |
| A shopkeeper may only change their own products | `product.shop_id` identifies the owner through the shop. |
| Other shopkeepers must see and compare requests | A pending request has no destination. The board is every `pending` row except the caller's own shop. |
| The sender prices that transfer | `unit_price` is on the request, not on the product. The same rice can be offered at a different price next time. |
| Export names product, quantity, and source | Those are set at create time. The target shop is set when someone accepts. |
| Accept moves quantity and is stored | The same row stays. Status and `accepted_at` record the move. Stock changes are other columns in the same transaction, not a UI-only edit. |
| "Risk of expiring" in the problem statement | No field and no API. Left out on purpose. |

The sample Trade entity was the idea we kept, with the gaps filled: status, both shops, the source product, and a destination product that does not exist until accept.

## ER diagram

```mermaid
erDiagram
    SHOPKEEPER ||--|| SHOP : owns
    SHOP ||--o{ PRODUCT : stocks
    PRODUCT ||--o{ TRANSFER_REQUEST : "requested from"
    PRODUCT |o--o{ TRANSFER_REQUEST : "received into"
    SHOP ||--o{ TRANSFER_REQUEST : sends
    SHOP ||--o{ TRANSFER_REQUEST : receives

    SHOPKEEPER {
        int id PK
        string name
        string email UK
        string password_hash
        datetime created_at
        datetime updated_at
    }

    SHOP {
        int id PK
        int shopkeeper_id FK UK
        string name
        string address
        string image_url "nullable"
        datetime created_at
        datetime updated_at
    }

    PRODUCT {
        int id PK
        int shop_id FK
        string name
        string description
        int quantity "zero or more"
        datetime created_at
        datetime updated_at
    }

    TRANSFER_REQUEST {
        int id PK
        int source_product_id FK
        int destination_product_id FK "nullable until accepted"
        int source_shop_id FK
        int destination_shop_id FK "nullable until accepted"
        int quantity "greater than zero"
        numeric unit_price "price for one unit, greater than zero"
        numeric total_price "quantity times unit_price, stored"
        string status "pending, accepted, rejected, cancelled"
        datetime created_at
        datetime accepted_at "nullable"
    }
```

## Relations

### Shopkeeper and Shop — one to one

`shop.shopkeeper_id` points at `shopkeeper.id` and is unique. Each person has one shop. Each shop has one person. Signup writes both rows or neither.

The shopkeeper name is the person. The shop name is the stall. Login uses email and `password_hash`. The home page uses the shop's name, address, and image.

### Shop and Product — one to many

`product.shop_id` points at `shop.id`. A shop has many products, or none. A product belongs to exactly one shop.

Ravi can stock rice, oil, and flour: three rows, one `shop_id`. Meera's rice is another row with her `shop_id`. Transfer never retargets Ravi's row at both shops.

### Shop and Transfer request — one to many, twice

`source_shop_id` points at the shop that published the request. While the row is pending, `destination_shop_id` is empty, so the request is not tied to one receiver. Any other shop can accept it. Accept writes that shop into `destination_shop_id`. One shop can publish many requests and can later be the receiver on other shops' requests. Source and destination, once both are set, must be different shops.

### Product and Transfer request — one to many, twice

`source_product_id` points at the product that will lose quantity. A product can be in many requests over time. The product's quantity is the stock. The request's quantity is how much this offer wants to move. The source product's shop must be `source_shop_id`.

`destination_product_id` is empty while the request is pending. On accept it points at the product that gained the quantity. That product's shop must be `destination_shop_id`.

## How a request is sent and compared

Ravi (shop 1) has product 10, Rice, quantity 20. He enters quantity 5 and a unit price of 40. NestJS checks that 5 is above zero, that 40 is above zero, and that his pending requests for this product do not already claim more than 20. It inserts one row. His quantity stays 20 until someone accepts. The price is the price of this offer, not a new column on the product.

Meera and the other shopkeepers open the transfer list. The API returns pending requests whose source shop is not theirs. Each row shows the source shop, the product name, the quantity, the unit price, and the total (unit price times quantity). They compare those rows with each other. Meera accepts the rice offer. A second shopkeeper who accepts a moment later changes no rows, because the status is no longer pending.

The sender's own list is the outgoing view: same rows, no accept button. `cancel_transfer_request` sets `cancelled` and frees the reserved quantity. It does not move stock.

## What accept writes

Before accept:

| Row | Important columns |
|---|---|
| Product 10 | shop_id 1, Rice, quantity 20 |
| Request | source_shop_id 1, destination_shop_id empty, source_product_id 10, quantity 5, unit_price 40, status pending |

After Meera (shop 2) accepts, in one transaction:

| Row | Important columns |
|---|---|
| Product 10 | quantity 15 |
| Product 18 | shop_id 2, Rice, quantity 5, a new row even if Meera already stocks Rice |
| Request | destination_shop_id 2, destination_product_id 18, unit_price still 40, status accepted, accepted_at set |

If a second accept runs, the status update matches zero rows because the request is no longer pending. The second transaction does not change quantities.

`rejected` and `cancelled` leave `destination_product_id` empty and do not change quantities.

## Rules the diagram cannot draw

- Requested quantity is greater than zero.
- Unit price is greater than zero. It is the price of one unit. The screen shows quantity times unit price as the total.
- The sum of pending quantities for a product cannot exceed that product's quantity. Those units are reserved for the board even though the shelf quantity has not changed yet.
- On accept, requested quantity is not greater than the source product's current quantity.
- The accepting shop is not the source shop.
- Source shop and destination shop are different once destination is set.
- Source product belongs to the source shop.
- Destination product, once set, belongs to the destination shop.
- Product quantity never goes below zero.
- A pending request blocks deletion of its source product.
- Email is unique.
- Passwords are stored only as a hash.
- The unit price is fixed when the request is created. Comparing shopkeepers must not see the price change while they decide. A new price is a new request.
- Create, accept, cancel, and a quantity edit all lock the product row first, then the request row, inside one transaction. The full race list is in [beyond-assignment.md](beyond-assignment.md).

## Settled in this database

1. **Destination stock.** Accept inserts a new product row for the moved quantity. It does not add that quantity onto a product that already has the same name. Two accepts cannot both look up "Rice," both find nothing, and both insert. The destination shelf can show two rows named Rice.
2. **Cancel.** `cancel_transfer_request` sets a pending row to `cancelled` and frees the reserved quantity. It does not move stock. Accept and cancel both require the row to still be pending, so only one of them wins.
3. **Rejected.** The status exists so a request can end without moving stock. No function sets `rejected`. Whether a screen offers that action is still open, and it is listed in [README.md](README.md).

## Left out on purpose

| Idea | Why it is not a table or column |
|---|---|
| Market | One deployment is one market. No screen picks a market. |
| Expiry date | Mentioned in the problem story. No page or API records it. |
| Sales history | "Sells faster" is the motivation. No page records a sale. |
| Separate completed-transfer table | Accept and the stock movement are one operation. The request row is the record. |
| created_by, accepted_by | Already determined by the two shops' owners. |
| Offer and Bid tables | A later way to compete for a transfer. Specified in [scalability.md](scalability.md). The first migration does not include them. The stock move stays on Transfer request. |
