# Push 3 — password trim, query notes, page cache, restyle, and the project notes

Date: 2026-10-08

Branch: `main`

Remote: `https://github.com/HarshadKaushal/vMarket` (private)

## What this push is

Work done after the teammate pull (`cfc9bae`). Nothing here adds frontend or backend containers.

## Commits in this push

| Commit | Message | What it contains |
|---|---|---|
| `e6a28af` | fix: trim passwords before they are hashed or compared | Zod and both auth DTOs trim surrounding spaces. The edge-case note records it. |
| `3a3e0ac` | docs: name the concurrency case inside each transfer query | Comments on the four `$queryRaw` calls. The SQL functions are unchanged. |
| `ef086b8` | fix: do not reuse a dynamic page cached before login | `staleTimes.dynamic = 0`. |
| `0ab5d93` | feat: restyle shops, products, and transfers with shadcn/ui | Tailwind, shadcn components, search and sort on the three boards, nav links not prefetched. |
| `1ee28d8` | docs: add the setup guide and the project notes | Root `README.md`, implementation, features, design philosophy, domain notes, and a review file for every commit through this one. |
| this note | docs: record the third GitHub push | This file, the hash on the documentation review, and the review of this note. |

## Left on the machine

- `.env` and `backend/.env`
- `node_modules`, `.next`, `backend/dist`, and the generated Prisma client

App Dockerfiles are still not in the tree.
