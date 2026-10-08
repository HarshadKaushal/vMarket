# VMarket decisions

This folder records what we researched, what we chose, and what is still open. It is for explaining the project to a mentor. It is not a substitute for the assignment.

The assignment text we worked from is [VMarket_Assignment_Requirements_and_Recommendations.md](../VMarket_Assignment_Requirements_and_Recommendations.md).

## Chosen

| Piece | Choice | Record |
|---|---|---|
| Language | TypeScript | Required by the assignment. Not a free choice after that file was read. |
| Frontend | Next.js (React, App Router) | [frontend-nextjs.md](frontend-nextjs.md) |
| Backend | NestJS | [backend-nestjs.md](backend-nestjs.md) |
| Database | PostgreSQL | Required by the assignment. Design is in [database.md](database.md). |
| Database access | Prisma 7.10 | [orm.md](orm.md). `schema.prisma` is the TypeScript model. The SQL PostgreSQL ran is the Prisma migration. |
| Containers | Docker Compose: frontend, backend, PostgreSQL | [docker.md](docker.md) |
| Version control | Git and GitHub, feature branches, meaningful commits | Required by the assignment. |
| Login | JWT in an HttpOnly cookie | The token is still a signed JWT. PostgreSQL does not store it. Login sets `access_token` as an HttpOnly, Secure, SameSite=Strict cookie. The JSON body does not contain the token. |
| Form checks | Zod in the browser, class-validator in Nest | The form rejects a bad email or a short password before `fetch`. Nest `ValidationPipe` checks a DTO before the controller, so a request that skips the form is still rejected. |
| Changes the assignment did not ask for | Logged in one place, including concurrent accepts | [beyond-assignment.md](beyond-assignment.md) |
| Edge cases | Zod, the validation pipe, stock, and concurrent accept | [edge-cases.md](edge-cases.md) |
| Git pushes | One note per push, with the commits in that push | [pushes/README.md](pushes/README.md) |
| Controls | shadcn/ui on Tailwind CSS | [ui.md](ui.md) |
| How to run it | Host Nest and Next, Compose for Postgres only | [../README.md](../README.md) |
| What was built | Approach, features, design approach, domain rules | [implementation.md](implementation.md), [features.md](features.md), [design-philosophy.md](design-philosophy.md), [domain.md](domain.md) |
| AI review of each commit | One note per commit | [ai-reviews/README.md](ai-reviews/README.md) |

## Working database design

Four tables: Shopkeeper, Shop, Product, Transfer request. A pending request has a unit price and no destination yet. Other shopkeepers see those rows and compare them. The shop that accepts becomes the destination, and accept inserts a new product row on that shop. The sender can cancel a still-pending request. The brainstorm and the relations are in [database.md](database.md).

`schema.prisma` describes those four tables for TypeScript. It is not the script PostgreSQL runs. The script is [backend/prisma/migrations/20261007063300_init/migration.sql](../backend/prisma/migrations/20261007063300_init/migration.sql). That SQL also holds the checks, the board view, and the create, accept, and cancel functions, which the schema file cannot express. [orm.md](orm.md) explains the split.

## Not chosen yet

- A frontend data-fetching library. Pages still call Nest with `fetch`.
- Whether a screen can set a request to `rejected`. The value exists on the status list. No database function sets it. Cancel is already a function.

## Shape of the running system

```text
Browser
  |
  v
Next.js container          pages, layouts, loading and error states
  |
  |  HTTP JSON
  v
NestJS container           login check, product rules, transfer transaction
  |
  v
PostgreSQL container       the four tables
```

Next.js does not connect to PostgreSQL. NestJS uses Prisma Client for ordinary reads. Publish, accept, and cancel call SQL functions, and those functions are the transactions.
