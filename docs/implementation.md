# Implementation

This note describes how the code that is in the repository was built. It does not describe containers or screens that are still missing.

## Approach

The work was split by layer, and each layer had to be explainable before the next one was treated as done.

1. Write down the stack and the data rules.
2. Put those rules in PostgreSQL: tables, checks, a view, triggers, and three functions.
3. Put NestJS in front of that database. Ordinary reads use Prisma Client. Publish, accept, and cancel call the functions with `Prisma.sql` and `$queryRaw`.
4. Put Next.js in front of Nest. Pages fetch JSON. Forms post JSON. No page opens PostgreSQL, and no Server Action accepts a transfer.
5. Group that working tree into commits, push it, and pull a second copy so the history itself could be explained.
6. Fix two bugs that showed up while using the app: passwords with surrounding spaces, and a Transfers page cached from before login.
7. Restyle the existing screens with Tailwind and shadcn/ui without changing the API routes.

## Technical decisions that are in the code

| Decision | Where it shows up |
|---|---|
| One shopkeeper owns one shop | `shops.shopkeeper_id` is unique. Signup writes both rows in one transaction. |
| JWT in an HttpOnly cookie named `access_token` | `backend/src/auth/access-token-cookie.ts`. Login JSON is `{ authenticated: true }`. The guard reads `request.cookies.access_token`. |
| Same 401 for unknown email and wrong password | `AuthService`. |
| Email is trimmed and lowercased. Surrounding password spaces are trimmed. A space inside the password stays. | Zod in `frontend/lib/validation.ts`. `@Transform` on `RegisterDto` and `LoginDto`. |
| bcrypt cost 10 | `AuthService`. |
| Product quantity lives on the product row for one shop | `products.quantity`. |
| Publish does not decrease the shelf. Pending quantities are reserved. | Trigger `transfer_requests_reserve_stock` and `products_cover_pending_transfers`. |
| Unit price is fixed at publish. `total_price` is generated. | Column default in the migration. No update function for price. |
| Destination is null until accept | `destination_shop_id` and `destination_product_id` are nullable. |
| Accept inserts a new product on the destination shop | `accept_transfer_request`. Rows are not merged by name. |
| Two accepts, or accept against cancel, have one winner | `UPDATE ... WHERE status = 'pending'` after locking the product, then the request. The loser gets 409. |
| Status values are pending, accepted, rejected, cancelled | Enum `transfer_status`. `rejected` is set by `reject_transfer_request` for a private offer. |
| Browser stays on port 3001 | `rewrites` in `frontend/next.config.ts` send `/api/:path*` to Nest. |
| Search does not call Nest | `shop-directory.tsx`, `product-directory.tsx`, `offer-directory.tsx` filter the array the page already loaded. |

Prisma 7 is configured in `backend/prisma7.config.ts`. The database URL is not in `schema.prisma`. The client is generated with the `pg` adapter. Checks, triggers, the view, and the functions are only in the migration, because the schema file cannot express them.

## Milestones

| When | What landed |
|---|---|
| Decision notes | `docs/` and the working rules, before the application commits. |
| Database | `schema.prisma`, the init migration, Compose for Postgres. |
| API | Auth, shops, products, transfers. `GET /health`. |
| Screens | Signup, login, shops, a shop's shelf, my products, the transfer board. |
| First push | History grouped by layer onto `main`. Remote: `https://github.com/HarshadKaushal/vMarket`. |
| Pull check | A second clone added `docs/pushes/002-teammate-pull.md`. The original folder fast-forwarded to that commit. |
| Password trim | Form and both DTOs trim the password before the length check, the hash, and the compare. |
| Query comments | Each `$queryRaw` in `transfers.service.ts` names the race it is there for. |
| Fresh page after login | `staleTimes.dynamic = 0`, and nav `Link`s use `prefetch={false}`. |
| Restyle | shadcn/ui `base-nova` on Tailwind v4 for the nav, auth forms, shops, my products, and transfers. |

The first push did not pretend each feature was committed on the day it was written. The files were already on disk, so they were grouped into layer commits. Later fixes are their own commits.

## Challenges that actually came up

**A password with leading spaces.** Signup stored the email trimmed and lowercased, and stored the hash of the password including the spaces. Login then required those spaces. The form and the DTOs now trim first. One local account that had already been hashed with the spaces was rehashed on that machine. That rehash is not a migration and is not in git.

**The Transfers page asked for login while the nav showed a shop name.** Next had prefetched `/transfers` before login and reused that server payload. The fix is to stop prefetching those links and to set the dynamic stale time to 0. A second login was not added.

**shadcn's sort menu crashed the shops page.** The preset uses Base UI. `DropdownMenuLabel` must sit inside a menu group. The sort menus do not use that label. Radio items stay inside `DropdownMenuRadioGroup`.

**Global `button` CSS hid the sort label.** An unlayered button rule painted the shadcn trigger white on white. Fallback button and input styles are now in `@layer components` and skip elements that have `data-slot`.

**The generated theme set `--font-sans` to itself.** It now points at the Geist font variable from the root layout.

**Prisma could not be the whole database.** Concurrent accept was tested with two shops. One request returned 201 and the other 409, and the source quantity dropped once. That behavior lives in the SQL function, not in `prisma.transferRequest.update`.

## Trade-offs

- Client-side search is enough for the current lists. It does not scale to a paged catalog, and a shop that is not in the fetched array cannot be found.
- Copying shadcn components into the repo makes them readable. It also means theme variables for a dark mode that has no switch.
- `rejected` is only the invited shop's answer to a private offer. A public offer still ends by accept or by the sender cancelling. A third shop cannot reject a board offer.
- Running Nest and Next on the host makes the cookie rewrite and the SQL functions easy to inspect. It does not meet the assignment's three-container requirement yet.
- Comments in the query strings document the races without editing a migration that has already been applied.
