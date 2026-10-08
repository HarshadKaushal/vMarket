# Backend: NestJS

## Decision record

### Context

The frontend is Next.js. It needs an HTTP API for signup, login, product create/read/update/delete, export requests, and accept. Accepting a request must change the export and the stock together, and a second accept of the same request must not move the stock again. A shopkeeper must not change another shop's products. The assignment requires NestJS. The research still compared it with the other realistic Node choices so the structure is understood rather than copied.

### Problem

Pick the API framework that keeps a visible place for the URL, the login check, and the transfer rule as more routes are added.

### Options considered

1. **Express.** A small HTTP library. The team lists the routes and invents the folders. Middleware is how a login check runs before a route.
2. **Fastify.** A small HTTP library with a schema on the route. A body that does not match the schema is rejected before the transfer function runs. Folders are still the team's choice.
3. **NestJS.** An application framework on top of HTTP. A controller owns the URL, a guard owns "who is this?", and a service owns the rule. Modules group those pieces.

### Decision

Use **NestJS** with **TypeScript**.

This matches the assignment. The comparison is why we kept it instead of treating Express or Fastify as a replacement.

### Reasons

The same reason as Next.js: a growing codebase should not require a new shape for each feature.

- `POST /exports/:id/accept` is a method on an exports controller, not a line in a long list of `app.post` calls.
- The accept transaction has an obvious file, the export service. Reviewers can say "the stock change belongs in the service" and mean one place.
- A guard is the shared login check. It does not replace the second check, which is "does this shopkeeper own the destination shop?" That check stays in the service.
- At five routes the structure is heavy. At the full set of shop, product, and transfer routes, products and exports look alike, so a new module is a copy of a known shape.

Fastify's schema gate is a real advantage for "quantity must be a number." NestJS only has that gate if a validation pipe is turned on. Turning that pipe on is part of using NestJS here, not an optional extra. The validation library itself is a later decision.

Express would make the accept function easy to read on day one. It would also allow login, validation, and the stock update to pile into one function. We would have to write and enforce the folder rule that NestJS already names.

### Trade-offs

- **Learning curve.** Modules, providers, guards, pipes, and decorators come before the transfer is interesting. Dependency injection means NestJS hands the service its database access instead of the service creating it. Tests can pass a fake. The first week is framework study as well as business study.
- **Decorators can hide the unsafe path.** The structure does not make the transaction correct. A service that loads a request, checks the status in JavaScript, and then saves it can still lose a race. The safe version updates the row only if it is still pending, inside a database transaction.
- **Operational picture does not change.** Express, Fastify, and NestJS are all one Node process. NestJS does not add a container. Compose is still Next.js, NestJS, and PostgreSQL.
- **Raw request speed is not the reason.** Fastify handles more requests per second than Express. This market will hit database contention on accept before it hits that limit.
- **NestJS does not know VMarket's rules.** Quantity greater than zero, no export to the same shop, only the destination shop accepts, and no second accept are our code and our database constraints.

### Consequences

- Every feature is a module with a controller and a service. Shared checks become guards. Input checks become a pipe used on every route.
- The export service is the only place that calls `accept_transfer_request`. That SQL function is the transaction. The service does not load the row in TypeScript and save it back. Prisma Client is used for ordinary reads. The function call is the write. [orm.md](orm.md) records why.
- Tests that matter: wrong password, shop A editing shop B's product, accepting twice, and accepting more than the available quantity.
- Login is a JWT carried in an HttpOnly cookie. `POST /auth/login` checks the password hash and sets `access_token`. The cookie is HttpOnly, Secure, and SameSite=Strict, and it lasts one day. The JSON body does not include the token, so page scripts cannot read it. PostgreSQL does not store the login. `GET /auth/me` reads that cookie and rejects a missing or invalid token. `POST /auth/logout` clears the cookie. A server-side session was the alternative. It can be revoked immediately, and it needs a session store shared by every API process. The signup and login forms use Zod and reject a bad body before `fetch`. Nest uses DTO classes with class-validator. A global `ValidationPipe` checks those classes before the controller runs, including when a request skips the form.
- `POST /products` and `GET /products` require that cookie. Both use the shop owned by the shopkeeper id in the token. `PATCH /products/:id` and `DELETE /products/:id` require the cookie and change only a product on that shop. A quantity edit cannot go below the pending offers for that product. A product with a pending offer, or one already named on a past transfer, cannot be deleted. `GET /shops/:shopId/products` is public, so any caller can see a shop's shelf. Writes still cannot choose another shop.
- `POST /transfers` requires the cookie and calls `create_transfer_request`. The source shop comes from the token. `GET /transfers` lists the pending board with no cookie. `POST /transfers/:id/accept` requires the cookie and calls `accept_transfer_request`. The accepting shop comes from the token. The function inserts a new product row on that shop. `POST /transfers/:id/cancel` requires the cookie and calls `cancel_transfer_request`. The source shop comes from the token. The function sets a still-pending row to `cancelled` and does not move stock.

## Technology note

1. **What it is.** NestJS is a TypeScript framework for HTTP APIs. It organizes code into modules, controllers, and injectable services.
2. **What problem it solves.** It gives a named place for the route, the permission check, and the business rule so those do not collapse into one function as the API grows.
3. **What alternatives exist.** Express and Fastify. Both can implement every required endpoint.
4. **What VMarket requires.** The five API areas in the assignment, authorization on every protected operation, and a transaction around accept.
5. **Why it was selected.** It is the assignment's backend, and its structure matches the reason Next.js was chosen: conventions instead of a structure each developer invents.
6. **What trade-offs it introduces.** More concepts up front, and a false sense of safety if the accept service uses a load-then-save pattern.

## How accept is split

The shopkeeper clicks Accept in Next.js. Next.js sends the request to NestJS. NestJS then does three different jobs:

| Piece | Job |
|---|---|
| Guard | Rejects a caller who is not logged in. |
| Controller | Reads the export id from the URL and calls the service. |
| Service | Checks that this shopkeeper owns the accepting shop, then calls `accept_transfer_request`. |

That function marks the request accepted only if it is still pending, decreases the source quantity, and inserts a new product row on the accepting shop. If any step fails, none of the writes remain. A Prisma `update` of the same row is not this path.

## Comparison notes from the research

| Concern | NestJS | Fastify | Express |
|---|---|---|---|
| Where a feature lives | Controller, service, and guard, repeated for each area. | Route plus schema. Folders are yours. | Route plus middleware. Folders are yours. |
| TypeScript | Designed for it. Types do not validate a live HTTP body. | Strong when the schema generates the types. | Works. The body is a loose object until a validation library is added. |
| Bad JSON | A validation pipe, once it is enabled. | Schema on the route, before your function. | You add it, and one route can forget. |
| Login check | A guard attached to the route. | A hook or plugin. | Middleware. Easy to forget on one route. |
| Seeing one route | Highest, after the vocabulary is learned. | Search for the path. | The easiest single function to read. |
| First route | Module, controller, and service. | One file and a schema. | One file. |
| Docker | One API container. | One API container. | One API container. |
| Tests of the transfer | Built-in testing module. More ceremony. | Can inject a fake HTTP request. | A test client calls the route. Easiest to read aloud. |

All three need the same PostgreSQL transaction for the double accept. The framework choice does not replace that transaction.
