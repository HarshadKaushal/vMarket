# Push 1 — first upload

Date: 2026-10-08

Branch: `main`

Remote: `https://github.com/HarshadKaushal/vMarket` (private)

## What this push is

The project had no git history. The working code was already written, so this push does not pretend that each feature was committed on the day it was built. The files were grouped into a few commits that a reviewer can read one layer at a time.

## Commits in this push

| Commit | Message | What it contains |
|---|---|---|
| `bf124f9` | chore: keep secrets and build output out of git | Ignore rules and `.env.example` files. Real `.env` files stay on the machine. |
| `0a3d52d` | docs: record the architecture decisions and working rules | `docs/`, the assignment brief, and the working rules. |
| `b66d825` | feat: add the PostgreSQL schema and init migration | Prisma schema, the SQL migration, and Compose for Postgres only. |
| `f3c59cb` | feat: add the NestJS API for auth, products, and transfers | Nest source. Transfer writes call the SQL functions. |
| `6d2203f` | feat: add the Next.js screens for shops, products, and transfers | Pages, forms, and the shared navigation. |
| this note | docs: record the first GitHub push | This file and the row in `docs/README.md`. |

## Left on the machine

- `.env` and `backend/.env`
- `node_modules`, `.next`, `backend/dist`, and the generated Prisma client

App Dockerfiles are not in this push. They wait for a later decision.
