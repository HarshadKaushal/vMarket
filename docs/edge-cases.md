# Edge cases we hit and how they are handled

This note is for explaining the project. It records problems that showed up while building VMarket, and the code that answers them. It is not a new design.

## Two checks, on purpose

A form check can be skipped. Curl, or a changed request, never runs the React form.

| Where | Tool | What it stops |
|---|---|---|
| Browser, before `fetch` | Zod `safeParse` in `frontend/lib/validation.ts` | A blank name, a short password, a bad email, a bad quantity, a bad price. `fetch` does not run. |
| Nest, after the JSON is parsed | Global `ValidationPipe` and DTO classes | The same kinds of bad bodies when the form is skipped. |
| PostgreSQL | Checks, triggers, and the transfer functions | Stock, locks, and status. Nest cannot be the last word on two requests at once. |

`safeParse` returns `{ success: false, error }` or `{ success: true, data }`. It does not throw. The form shows `error` and returns before `fetch`. On success, `data` is the cleaned value: trimmed text, a lowercased email, a quantity that is a number.

The Nest order is middleware (`cookie-parser`), then the JWT guard on protected routes, then `ValidationPipe`, then the controller. A missing cookie on `POST /products` is 401 even if the body is also wrong. Login has no guard, so the pipe runs and then `AuthService` checks the password.

`ValidationPipe` is on in `backend/src/main.ts` with `transform`, `whitelist`, and `forbidNonWhitelisted`.

## Signup and login

| Case | What happens |
|---|---|
| Email with spaces around it, such as `  Meera@Example.com  ` | Zod and the DTO trim and lowercase it to `meera@example.com` before save or lookup. |
| Email with a space in the middle, such as `meera @example.com` | Zod blocks it in the form. If curl sends it, `@IsEmail()` on `RegisterDto` / `LoginDto` returns 400. The old handwritten check only looked for `@` and a dot, so this used to get stored. |
| Password shorter than 8 characters | Zod blocks the form. The DTO returns 400. Spaces around the password are removed first, so a short password padded with spaces still fails. |
| Password with spaces around it, such as `    Harsh@123` | Zod and the DTO trim it before the hash is saved and before login compares it. A space in the middle stays part of the password. |
| Blank name, shop name, or address | Zod blocks the form. `@IsNotEmpty()` after trim returns 400. A name of only spaces is blank after trim. |
| `imageUrl` that is not a URL | Zod blocks the form. `@IsUrl()` returns 400. An empty image becomes `null`. |
| Extra JSON field, such as `shopkeeperId` | `forbidNonWhitelisted` returns 400. The shop is never taken from the body. |
| Duplicate email | Prisma unique error `P2002` becomes 409 "An account with this email already exists". |
| Wrong password or unknown email | Both return the same 401, "Invalid email or password". Login does not insert a row. |
| Token in the JSON body | Login returns `{ authenticated: true }` only. The token is the `access_token` cookie: HttpOnly, Secure, SameSite=Strict. Page JavaScript cannot read it. |
| Browser on port 3001 calling Nest on port 3000 | Next.js rewrites `/api/:path*` to Nest. The browser stays on the Next origin, so the cookie is stored and sent there. The Next server forwards that cookie when it calls `GET /auth/me` or `GET /products`. |

## Products and the shelf

| Case | What happens |
|---|---|
| `GET /shops/:shopId/products` with no cookie | Allowed. The shop page needs the shelf so another shopkeeper can see what a shop holds. This is the whole shelf, not the offers. |
| `GET /products` with no cookie | 401. This route is only the logged-in shopkeeper's shelf. The shop id comes from the cookie. |
| Create or edit with a `shopId` in the body | 400, because that field is not on the DTO. The service uses the shop of the cookie's shopkeeper. |
| Meera editing Ravi's product id | 404 "Product not found". The query is `id` plus her shop id. |
| Quantity below the pending offers for that product | The trigger `products_cover_pending_transfers` raises. Nest returns 409. |
| Delete while a pending offer points at the product | 409 "Cancel pending transfers before deleting this product". |
| Delete after cancel, or after accept | 409 "This product is part of a transfer and cannot be deleted". The old offer row still points at the product. |
| Quantity on a product | A whole number, zero or greater. An offer quantity must be greater than zero. |
| Accept of rice when the destination already has rice | A new product row is inserted. Rows are not merged by name. |

Bigint ids are strings in JSON. JavaScript numbers cannot hold every bigint.

## Transfers

Publishing does not move stock. The shelf quantity stays until accept. The new row has no destination and status `pending`. `GET /transfers` reads the view `open_transfer_board`, which is pending rows only. An accepted or cancelled row stays in `transfer_requests` as history and disappears from the board.

The form and the buttons:

| Case | What happens |
|---|---|
| Not logged in | The board is visible. There is no publish form and no Accept or Cancel button. |
| Logged in, empty shelf | The publish form says to add a product first. |
| Bad quantity or price in the form | `publishTransferSchema.safeParse` fails. `POST /transfers` is not sent. |
| Curl with a bad price or quantity | `PublishTransferDto` returns 400. |
| Offer for another shop's product | `create_transfer_request` raises. Nest returns 403. |
| Pending offers would add up to more than the shelf | The reservation trigger raises. Nest returns 409. The row is not inserted. |
| Accept your own offer | The button is Cancel, not Accept. If accept is called anyway, the SQL function raises and Nest returns 403. |
| Cancel someone else's offer | The button is not shown. The SQL function looks up the offer by id and source shop, so Nest returns 404. |
| Cancel or accept when the offer is no longer pending | 409 "Transfer request is no longer pending". Cancel does not move stock. |
| Second accept of the same offer | 409. Quantities change only for the accept that won. |
| Private offer with a `recipientShopId` | The row is pending, names that shop, and is excluded from `open_transfer_board`. It still reserves shelf quantity with the other pending rows. |
| Private offer to your own shop | 403. |
| Accept or reject a private offer when you are not the invited shop | 404. The response does not confirm that the row exists. |
| Reject a public offer | 404. Reject matches `recipient_shop_id`, and a public offer has none. |
| Accept, reject, and cancel of one private offer | All three lock the product first, then change the row only while it is pending. One commits. The others get 409. Reject and cancel do not move stock. |

## Concurrency

Two requests can pass a check in TypeScript and then both write. The transfer writes therefore do not use `prisma.transferRequest.create` or `update`. They call SQL functions with `$queryRaw`.

**Two publishes at the same time.** `create_transfer_request` locks the product row:

```sql
SELECT ... FROM products WHERE id = p_source_product_id FOR UPDATE;
```

The second publish waits. It then sees the first pending quantity. If the two offers together exceed the shelf, the second gets 409. The lock is in `backend/prisma/migrations/20261007063300_init/migration.sql`.

**Accept against a quantity edit.** Updating the product locks that row. The pending-quantity trigger runs while the lock is held. A publish of the same product waits on the same lock, so it cannot sneak in between the read and the update.

**Two accepts at the same time.** `accept_transfer_request` locks the product, then the transfer request. The status update is:

```sql
UPDATE transfer_requests
SET status = 'accepted', ...
WHERE id = p_request_id AND status = 'pending';
```

One transaction updates one row and inserts the destination product, then lowers the source quantity. The other updates zero rows and raises "transfer request is no longer pending". Its insert is rolled back. This was run with Meera and Ali accepting together: one 201, one 409, and the source quantity dropped once.

The lock order is always the product, then the request, so two transactions do not lock those rows in opposite orders and wait on each other.

**Cancel against accept.** Both require the row to still be pending. One wins. The other gets 409.
