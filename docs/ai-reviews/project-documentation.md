# 1ee28d8 — docs: add the setup guide and the project notes

## What the commit contains

- `README.md`: how to copy the env files, start PostgreSQL, generate the Prisma client, migrate, and run Nest and Next on the host
- `docs/implementation.md`: the layer order, the decisions that are actually in the code, the milestones, the bugs that were fixed, and the trade-offs
- `docs/features.md`: completed, partial, and pending behavior
- `docs/design-philosophy.md`: the engineering approach used so far
- `docs/domain.md`: the market rules, the assumptions, and where this model differs from the sample "export already names a target shop"
- `docs/ai-reviews/`: one review for each commit from `bf124f9` through `0ab5d93`, plus this file

## Review

The setup steps match the scripts in `backend/package.json` and `frontend/package.json`: Nest `start:dev` on port 3000, Next `dev` on port 3001, `prisma generate`, and `prisma migrate deploy`. The README says the app containers are not built. Feature status marks `rejected`, the old shop-shelf layout, Dockerfiles, tests, and an ER diagram as partial or pending, because those are the gaps in the tree.

The reviews for the older commits were written when this documentation was added. They were not in those original commits. Rewriting the pushed history to insert them would have been worse than saying so here.

## Decision

Document the system that runs. Do not describe the three-container Compose file as if it already exists.
