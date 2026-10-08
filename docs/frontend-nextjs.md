# Frontend: Next.js

## Decision record

### Context

VMarket needs shopkeeper screens: signup, login, a list of shops, a shop's products, create and edit product, create an export request, and accept one. Each screen needs a form or a list, plus loading, empty, error, and logged-out states. The backend decides whether an action is allowed. Docker Compose is required to run the frontend, the backend, and PostgreSQL as separate services.

The assignment names React and the Create React App TypeScript template. It also allows technology choices to be researched and changed when a recommendation is no longer the one we want to defend.

### Problem

Pick the frontend tool that can grow past the first handful of screens without the team inventing a new structure for every page, while the transfer rules stay in the API.

### Options considered

1. **Vite + React + React Router as a library.** A route table maps `/products` to a component. Layouts use a parent route and an outlet. Code splitting and prefetch are possible and are not the default.
2. **React Router 7 in framework mode.** File-based routes, nested layouts, and route-level splitting, with the option to build a static site (`ssr: false`). Fewer teams know this convention than know Next.js.
3. **Next.js App Router, used as the frontend.** File-based routes, nested layouts, automatic splitting, and link prefetch. The standard deployment is a Node server, even when the database calls live in NestJS.

React itself is not one of the three options. Next.js and both React Router setups are ways of building a React app.

### Decision

Use **Next.js** for the frontend, in **TypeScript**.

The API is a separate NestJS service. Next.js renders the screens. It does not open PostgreSQL, and it does not accept an export in a Server Action.

This replaces the assignment's Create React App recommendation. Create React App is no longer the current way to start a React app, and it does not provide the layout, splitting, and file-routing conventions that drove this choice.

### Reasons

The useful property is convention, not a longer feature list.

- A file at `app/(shop)/products/page.tsx` is the `/products` page. A dynamic id is `app/products/[id]/page.tsx`.
- `(shop)/layout.tsx` wraps every shopkeeper page underneath it. Login and signup stay outside that folder.
- Each route is split into its own JavaScript automatically. A hand-written route table only splits if every page is loaded with `React.lazy`, and that step is easy to forget.
- Next.js prefetches a linked page when the link is on screen, so moving from the product list to the edit form often does not wait for a new download.
- `loading.tsx`, `error.tsx`, and `not-found.tsx` sit beside the page, which matches the required loading, error, and missing-product states.
- A new teammate can see login, signup, products, and requests from the folder tree.

We rated the codebase as it is expected to grow, not only the first assignment screens. Those first screens would fit in a route table. The Next.js concepts are paid now so later screens do not need a new architecture.

### Trade-offs

- **Another Node process.** Compose runs a Next.js server, a NestJS server, and PostgreSQL. A Vite build can be static files behind nginx. That simpler operation was the strongest argument against Next.js, and we accepted the extra runtime.
- **Server and client components are ongoing maintenance.** A form has to be a client component. A Server Action could accept an export and accidentally create a second backend. The folder convention is only a five-star maintainability story if this repo never connects to the database.
- **Features we are not using do not justify the choice.** Metadata, search-result pages, and Vercel-specific hosting were listed while comparing options. VMarket is a logged-in tool, and the assignment deploys with Docker. Those items are not reasons.
- **First load of a list can be faster** if the Next.js server calls NestJS and sends HTML that already contains the products. That is one phone round trip instead of "download the app, then fetch the list." Mutations such as accept are still a round trip after the click. If we use that server fetch, stock and request status must not be cached. A cached "still pending" page is how two shops think they accepted the same goods.
- **Learning curve.** React plus the App Router, layouts, and the server/client boundary. That cost is accepted. It is not a reason to put business rules in the frontend server.

### Consequences

- Routing is the App Router. React Router is not added.
- The frontend container is a Node process, not a static-file container.
- The home page is `frontend/app/page.tsx`. It loads `GET /shops` from NestJS on the server and does not import Prisma. Each shop links to `/shops/[shopId]`, which loads `GET /shops/:shopId/products`. A logged-in shopkeeper opens `/products` for their own shelf: `GET /products` with the cookie, plus create, edit, and delete through `/api/products`. `/transfers` loads the public pending board and, with the cookie, publishes, accepts, or cancels an offer. `cache: "no-store"` keeps those lists from being saved as static pages. `/signup` posts to `/api/auth/register` and then opens `/login`. `/login` posts to `/api/auth/login`. Next.js rewrites `/api/:path*` to NestJS, so the browser stays on the Next.js origin and stores the `access_token` cookie there. The home page then forwards that cookie to `GET /auth/me`.
- Shared TypeScript types, or a client generated from the API, can come after the API exists. They are not a reason to merge the two programs.

## Technology note

1. **What it is.** Next.js is a React framework. The App Router uses files under `app/` as the map of the site and can render on a Node server.
2. **What problem it solves.** It gives one project structure for pages, layouts, loading states, splitting, and navigation prefetch, so each new screen is not a fresh architecture decision.
3. **What alternatives exist.** Vite with React Router, and React Router 7 framework mode. Both can build every required screen.
4. **What VMarket requires.** The screens and states listed above, TypeScript, and a frontend container that calls a separate API.
5. **Why it was selected.** The folder structure stays readable as screens are added, and the team does not have to maintain a route table, manual splitting, and a prefetch scheme.
6. **What trade-offs it introduces.** A Next.js server in Docker, a server/client boundary to understand, and a hard rule that transfer logic stays in NestJS.

## Comparison notes from the research

| Concern | Next.js | React Router 7 framework | Vite + React Router library |
|---|---|---|---|
| Maintainability of structure | Highest. URLs and layouts follow from folders. The server/client boundary is a new kind of mistake. | Strong conventions. Less familiar to most teams. | Maintainable if the team writes and keeps its own rules. |
| More pages later | The same conventions still apply at 30 or 50 pages. | Capable. Less opinionated than Next.js. | Capable. The team owns more of the structure. |
| Routing | File path is the URL. | File-based in framework mode. | A route table you edit for every page. |
| Layouts | A layout file wraps the folder under it. | Nested layouts are a first-class feature. | A parent layout and an outlet. Same result, less obvious from the file tree. |
| Code splitting | Automatic per route. | Automatic for route modules. | Manual `React.lazy`, unless someone forgets. |
| Prefetch | Built into `Link` for routes on screen. | Available, often turned on per link. | Something the team would build. |
| Smallest first step | More concepts before the first page. | More concepts than the library. | React, Vite, and React Router only. |
| How it runs in production | Node server. | Can be built as static files. | Static files. |
| Finding a screen | The tree shows login, products, and requests. | Strong, with a newer convention. | The tree plus the route configuration. |

The choice is more convention in exchange for a frontend server. It is not a claim that Vite cannot scale, and it is not a claim that Next.js makes the transfer transaction faster.
