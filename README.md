# VMarket

Shops in one market list what they have on the shelf and publish offers for stock they want to move. Another shop accepts an offer. Accept creates a new product row on the receiving shop and lowers the quantity on the sending shop.

The browser talks only to Next.js. Next.js talks to NestJS. NestJS talks to PostgreSQL. Next.js does not open a database connection.

## What runs today

| Process | How it starts | Address |
|---|---|---|
| PostgreSQL 16 | Docker Compose | `localhost:5432` |
| NestJS API | `npm run start:dev` in `backend` | `http://localhost:3000` |
| Next.js | `npm run dev` in `frontend` | `http://localhost:3001` |

Frontend and backend containers are not written yet. Compose starts PostgreSQL only. Do not add the other two images until that step is explicitly approved.

## Prerequisites

- Node.js 20 or newer, with npm
- Docker Desktop, running, for the database

## First-time setup

From the repository root.

### 1. Database environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `POSTGRES_PASSWORD`. The example user and database are `vmarket`. The host port is `5432`.

### 2. API environment

```powershell
Copy-Item backend\.env.example backend\.env
```

Set both values in `backend/.env`:

```text
DATABASE_URL=postgresql://vmarket:YOUR_PASSWORD@localhost:5432/vmarket
JWT_SECRET=a-long-random-string
```

Use the same user, password, and database name as the root `.env`. Nest refuses to start if `JWT_SECRET` is missing. Do not commit either `.env` file.

### 3. Start PostgreSQL

```powershell
docker compose up -d
```

Wait until the container is healthy:

```powershell
docker compose ps
```

### 4. Apply the schema and start the API

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

`prisma generate` writes the client into `backend/generated/prisma`. That folder is gitignored. `migrate deploy` runs `backend/prisma/migrations/20261007063300_init/migration.sql`, which creates the tables, checks, the open-offer view, the triggers, and the transfer functions.

A healthy API answers `GET http://localhost:3000/health` with `{ "status": "ok" }`.

### 5. Start the site

In a second terminal, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3001`.

The browser calls `/api/...` on port 3001. `frontend/next.config.ts` rewrites that to Nest on port 3000, so the login cookie stays on the Next.js origin. If Nest is not on port 3000, set `API_URL` before starting Next. The same variable is used by server-side fetches.

## Using the app

The database starts empty. Create an account on **Sign up**. Signup asks for the person's name, email, password, shop name, address, and an optional image URL. It creates the shopkeeper and that shop together.

Then:

1. Log in.
2. Open **My products** and add a product (name, description, quantity).
3. Open **Transfers**, choose that product, and publish a quantity and a unit price.
4. Log in as a second shop and accept the offer.

Accept and Cancel are hidden until you are logged in. The public board is still visible.

Logout is `POST /api/auth/logout`. It clears the cookie. It does not delete products or offers.

## Pages

| URL | Who can use it | What it shows |
|---|---|---|
| `/` | Anyone | Shops. Search and sort run in the browser. |
| `/shops/[shopId]` | Anyone | That shop's shelf. |
| `/signup` | Anyone | Create a shopkeeper and a shop. |
| `/login` | Anyone | Sets the `access_token` cookie. |
| `/products` | Logged-in shop | That shop's products. Create, edit, delete. |
| `/transfers` | Board is public. Publish, accept, and cancel need login. | Open offers. |

## Checks before a request is stored

- The form uses Zod. A failed check does not call the API.
- Nest `ValidationPipe` checks the same kind of body again. `whitelist` and `forbidNonWhitelisted` are on.
- Stock, pending reservations, and one-winner accept or cancel are enforced in PostgreSQL, not by a Prisma `update`.

## Stopping

Stop the two Node processes with Ctrl+C. Stop PostgreSQL with:

```powershell
docker compose stop
```

`docker compose down` stops and removes the container. The named volume `vmarket_postgres` keeps the data. `docker compose down -v` deletes that data.

## Not in this repository

- `.env` files, `node_modules`, `frontend/.next`, `backend/dist`, and `backend/generated`
- Dockerfiles for Next.js and NestJS
- An automated test suite
- A drawn ER diagram (the tables are described in `docs/domain.md` and `docs/database.md`)
