# f3c59cb — feat: add the NestJS API for auth, products, and transfers

## What the commit contains

The Nest application: cookie parser, validation pipe, JWT guard, signup and login, shop list, product create/read/update/delete, and transfer publish, list, accept, and cancel. Prisma Client is constructed with the PostgreSQL adapter. Health is `GET /health`.

Publish, accept, and cancel use `$queryRaw` and `Prisma.sql`. Shop id is loaded from the cookie's shopkeeper before the SQL call. Prisma errors and the raised SQL messages are mapped to 400, 401, 403, 404, and 409.

## Review

Login returns `{ authenticated: true }` and sets `access_token`. The guard reads that cookie. Duplicate email is 409. Unknown email and a wrong password share one 401. Product routes take the shop from the cookie. A body field that is not on the DTO is rejected.

At this commit the password DTO did not trim. A password with surrounding spaces could be hashed with those spaces. That was fixed in `e6a28af`.

The raw queries did not yet carry comments. Those comments were added in `3a3e0ac` and do not change the SQL the database runs.

## Decision

Keep transfer writes on the SQL functions. Keep the shop id off the client body.
