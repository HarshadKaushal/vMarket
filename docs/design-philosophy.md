# Design philosophy

The engineering approach used for VMarket is small and visible. A reviewer should be able to point at the function, the page, or the migration that makes a rule true.

## The database decides contested writes

Two shopkeepers can accept the same offer at the same time. A check that only lives in TypeScript can pass for both of them. Publish, accept, and cancel therefore call SQL functions. Those functions lock the product row first, then the request row, and they only change a request that is still pending.

Reads stay on Prisma Client: shops, a shelf, the logged-in shop's products, and the open board. Prisma is not used to insert or update a transfer request.

## The browser does not hold a secret, and Next does not hold the database

The JWT is an HttpOnly cookie. Login does not put the token in JSON. Page scripts do not read it. The Next server forwards the cookie only when it loads the profile or the logged-in shelf.

Next.js is the UI. NestJS is the API. That split is why a transfer is not a Server Action.

## One screen does one job

Signup creates an account. Login sets the cookie. The home page lists shops. A shop page lists that shelf for anyone. My products edits only the logged-in shelf. Transfers publishes and accepts. Buttons that would call the wrong action are not rendered: Cancel on your own offer, Accept on someone else's, and neither when logged out. The API still checks, because a button can be skipped.

## Forms check, then the server checks, then the database checks

Zod stops a bad form before `fetch`. The validation pipe stops a bad body that never came from the form. PostgreSQL stops a quantity, a price, or a status change that both of those missed, including two requests in flight.

## Do not add a behavior in order to hide a bug

A stale Transfers page made it look like login was required twice. The cache was cleared. A second login step was not invented.

Search was added because the shops page was asked to filter the list it already had. It was then repeated on My products and Transfers. It was not turned into a new API.

## UI follows the data that already exists

shadcn/ui supplies the button, input, card, badge, and menu. The components live in this repo so they can be read. React Hook Form was not added. Zod was already the form check. The public shop shelf was left on the older layout because that page was not part of the restyle.

## History should match the layers

The first upload was grouped into ignore rules, decision notes, the database, the API, and the screens. Later changes are separate commits: password trim, query comments, the cache fix, and the restyle. Each push has a note in `docs/pushes/`. Work stays on `main` until there is a second branch. A pull request was not opened for the teammate note, because that note was committed on `main` in the second clone.
