# Docker

## Decision record

### Context

The assignment requires the frontend, the backend, and PostgreSQL to run as containers composed with Docker Compose. We chose Next.js for the frontend and NestJS for the backend.

### Problem

Describe what each container is responsible for, so the Compose file is not a pile of services we cannot explain.

### Options considered

**One Next.js process that also talks to PostgreSQL.** Fewer containers. It conflicts with the assignment's three-part layout and with the decision that accept runs in NestJS.

**Three containers.** Next.js, NestJS, and PostgreSQL. This is the assignment's shape and the shape our other decisions already assume.

A queue, a cache, or a second database was not considered. No current feature needs them.

### Decision

The final Compose file will run three services: Next.js, NestJS, and PostgreSQL.

Right now Compose starts **PostgreSQL only**. Frontend and backend images are added at the last stage, after those applications exist. The database is the piece the schema can be loaded into immediately.

| Service | Process | When |
|---|---|---|
| postgres | PostgreSQL 16 | Now. Host port comes from `POSTGRES_PORT` in `.env`. |
| backend | NestJS | Last stage. |
| frontend | Next.js | Last stage. |

### Reasons

The assignment asks for this split. It also matches the rule that the transfer transaction lives in NestJS. The browser never receives the database password. The Next.js container does not receive it either.

### Trade-offs

- Next.js is a Node server, so the frontend container is not a folder of static files. A Vite frontend could have been nginx plus files. We already accepted that cost in the frontend decision.
- A development Compose file is not automatically a production deployment. Production still has to think about image builds, secrets, the database volume, health checks, and backups. The volume keeps PostgreSQL data across container restarts. It is not a backup.
- Containers share a Compose network. The backend's database host is the PostgreSQL service name, not `localhost` inside that container.

### Consequences

- Environment variables hold the database password, the API URL, and the auth secret. They are documented by name later and are not committed.
- `prisma generate` runs when the backend image is built, so the NestJS container has the Prisma Client. That image does not exist yet. Until then, generate runs on the host from `backend`. PostgreSQL itself does not run Prisma. Compose starts an empty database, and `prisma migrate deploy` applies the migration.
- Adding Redis or a worker is a new infrastructure decision and needs a reason from a real feature.

## Technology note

1. **What it is.** Docker runs each part of the system in its own isolated process. Compose starts the three processes together and connects them.
2. **What problem it solves.** Anyone can run the same frontend, API, and database without installing PostgreSQL and Node by hand in a matching way.
3. **What alternatives exist.** Running all three on the host machine. That is fine for a quick check and does not meet the assignment.
4. **What VMarket requires.** A frontend container, a backend container, and a PostgreSQL container.
5. **Why it was selected.** It is an assignment requirement, and it keeps the Next.js and NestJS boundary visible.
6. **What trade-offs it introduces.** An extra Next.js runtime compared with a static frontend, and a database volume that must not be confused with a backup.

## Git

Git and GitHub are assignment requirements, not a comparison we ran. Feature branches and messages that name the behavior (`feat: add product creation endpoint`) are the expected history. Branches from the assignment's examples include authentication, products, export, transfer, and Docker.
