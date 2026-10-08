# Features

Status is against the application that is in this repository, not against a plan that was not built.

## Completed

| Feature | Behavior |
|---|---|
| Signup | Creates one shopkeeper and one shop. Duplicate email returns 409. |
| Login | Checks email and password. Sets `access_token` as an HttpOnly, Secure, SameSite=Strict cookie for one day. Body is `{ authenticated: true }`. |
| Logout | Clears that cookie. Products and offers stay. |
| Shop list | `GET /shops`. Cards show name, address, image or initials, and a link to the shelf. |
| Shop search and sort | Filters the loaded shop array by name or address. Sorts by name. |
| Public shelf | `GET /shops/:shopId/products` does not need a cookie. Unknown id uses `notFound()`. |
| My products | `GET /products` uses the shop on the cookie. Create, edit, and delete go to `/api/products`. |
| Product search and sort | Filters the loaded shelf by name or description. Sorts by name. |
| Delete rules | Pending offers must be cancelled first. A product that was already part of a transfer cannot be deleted. |
| Quantity edit | Cannot drop the shelf below the pending reserved quantity. |
| Publish offer | Logged-in shop only, and only for its own product. Quantity and unit price are required. Price is stored as entered. |
| Open board | `GET /transfers` reads pending rows from `open_transfer_board`. |
| Offer search and sort | Filters by product name, source shop name, or description. Sorts by product name. |
| Accept | Another shop only. Inserts a new destination product and decreases the source quantity. |
| Cancel | Source shop only, and only while pending. Does not move stock. |
| One winner | A second accept, or accept racing cancel, gets 409 once the first transaction commits. |
| Two layers of input checks | Zod in the form, then Nest `ValidationPipe`. |
| Password trim | Spaces around the password are removed in the form and in both DTOs. |
| Nav after login | The nav refetches the profile. A Transfers page prefetched while logged out is not reused. |

Shop id, product id, and offer id in the API come from the cookie or from the row, not from a shop id in the JSON body. An extra `shopId` or `shopkeeperId` field is rejected.

## Partial

| Feature | What exists | What does not |
|---|---|---|
| Transfer status `rejected` | The enum value is in PostgreSQL. | No function, route, or button sets it. Cancel is the only "stop" action. |
| Shop shelf page | The data and the route work. | `/shops/[shopId]` still uses the older list layout, not the shadcn cards. |
| Search | It filters the list already on the page. The badge counts the full list. | There is no search query parameter and no database search. |
| Dark theme variables | The shadcn preset generated them. | There is no theme switch. |
| Containers | PostgreSQL runs in Compose. | Next.js and NestJS have no Dockerfile and are not services in Compose. |
| Tests | Publish, accept, and the double-accept case were tried by hand against the local database. | There is no checked-in test suite. |
| Diagram | Tables and rules are written in `docs/database.md` and `docs/domain.md`. | There is no ER diagram file. |

## Pending

- Dockerfiles for the frontend and the backend, and a Compose file that runs all three.
- A drawn ER diagram of the four tables that were actually built.
- Automated tests for signup, login, product writes, publish, accept, cancel, and the double-accept case.
- A decision on whether `rejected` should ever be set. Until that decision, it stays unused.
- A data-fetching library. Pages still use `fetch`.
