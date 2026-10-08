# Wisflux Dev Task — VMarket: Connecting the Market

## 1. Assignment Overview

**Company/Task:** Wisflux — Dev Task  
**Project:** **VMarket — Connecting the Market**

### Core idea

Build a web application that connects multiple shops operating in the same market.

The problem identified in the assignment is that some shops sell products faster than others. A product may therefore remain unsold in one shop and risk expiring, while another shop may have customers who are more likely to buy the same product.

VMarket should allow products that are not selling well in one shop to be transferred to another shop where there is a higher chance of sale.

### Problems the application is intended to solve

1. Reduce product wastage.
2. Help shopkeepers avoid losses.
3. Save transportation costs by coordinating transfers within the market.
4. Collect data for the entire market in one system.
5. Provide a centralized system for participating shops.

> **Source:** Assignment PDF, page 1.

---

# 2. Technology Requirements

The assignment asks the developer to learn/use the following technologies:

| Area | Technology |
|---|---|
| Backend | NestJS |
| Frontend | ReactJS |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Sequelize / TypeORM / Prisma |
| Containerization | Docker |
| Version Control | Git / GitHub |

### Official / provided learning resources

- NestJS: https://nestjs.com/
- ReactJS: https://reactjs.org/
- TypeScript: https://www.typescriptlang.org/
- PostgreSQL: https://www.postgresql.org/
- Sequelize: https://sequelize.org/
- Prisma: https://www.prisma.io/
- TypeORM: https://typeorm.io/
- Docker: https://www.docker.com/
- Git: https://git-scm.com/

> **Assignment guidance:** Prefer online articles and official documentation rather than videos. Videos are suggested only for crucial tasks where good written resources are not available.

---

# 3. Required Implementation

## A. Frontend — React + TypeScript

The assignment specifies generating the frontend using the **Create React App TypeScript template**.

Reference:
https://create-react-app.dev/docs/adding-typescript/

### Required pages/features

#### 1. Home page

Create a home page that lists all registered/signed-up shops.

The page should allow a user to discover the shops participating in the market.

Suggested information to show:

- Shop name
- Address
- Optional shop image, if implemented
- Link/button to view products

#### 2. Shop product listing

Create a page that lists the products belonging to a particular shop.

Suggested information:

- Product name
- Description
- Quantity
- Shop information
- Export action where applicable

#### 3. Shopkeeper signup and login

Implement:

- New shopkeeper registration
- Login
- Authentication
- The assignment states that each shopkeeper is considered to have **only one shop**

Suggested signup fields based on the sample ER diagram:

- Name
- Email
- Password
- Address
- Optional shop image

#### 4. Add product

An authenticated shopkeeper must be able to add a new product to their shop.

Suggested fields based on the assignment:

- Product name
- Quantity
- Description

#### 5. Export request

A shopkeeper must be able to create a request to export/transfer a product to another shop.

The request should contain enough information to identify:

- Product
- Quantity
- Source shop
- Target shop

#### 6. Accept export request

A receiving shopkeeper must be able to accept a product export request.

Acceptance should trigger the import/transfer process.

#### 7. Product transfer

Once the request is accepted, the product quantity should be transferred from one shop to another.

The application should maintain the transfer as a database operation rather than simply changing the UI.

> **Source:** Assignment PDF, pages 2–3.

---

# 4. Backend — NestJS + TypeScript

The backend must be implemented using **NestJS with TypeScript**.

Reference:
https://docs.nestjs.com/first-steps

## 4.1 Database + ORM

Set up PostgreSQL and connect it to the NestJS backend using one ORM.

The assignment permits:

- Sequelize
- TypeORM
- Prisma

Database reference:
https://docs.nestjs.com/techniques/database

---

# 5. Required APIs

## API 1 — Create shopkeeper

Purpose:

Create a new shopkeeper/account and the associated shop.

Responsibilities should include:

- Validate registration data
- Store the password securely
- Create the shop record
- Prevent duplicate accounts where appropriate

The exact API design is left to the developer.

---

## API 2 — Login + authentication

Purpose:

Authenticate an existing shopkeeper.

Reference:
https://docs.nestjs.com/security/authentication

Additional provided resource:
https://progressivecoder.com/how-to-implement-nestjs-jwt-authentication-using-jwt-strategy/

Recommended responsibilities:

- Validate email/password
- Issue an authentication token
- Protect authenticated routes
- Identify the currently logged-in shopkeeper

---

## API 3 — Product CRUD

Implement CRUD operations for products.

Required operations:

- Create product
- Read product(s)
- Update product
- Delete product

NestJS CRUD reference:
https://docs.nestjs.com/recipes/crud-generator

The API should ensure that a shopkeeper cannot arbitrarily modify another shopkeeper's products.

---

## API 4 — Export product

Purpose:

Create a request to transfer a specified quantity of a product from one shop to another.

The request should capture the source and destination information.

---

## API 5 — Accept product export

Purpose:

Accept an export request and perform the import/transfer process.

The transfer should update the quantities belonging to the participating shops.

> **Source:** Assignment PDF, page 2.

---

# 6. Suggested Transfer Workflow

The assignment describes the following business flow:

```text
Shop A has Product X
        |
        v
Shop A creates export request
        |
        v
Shop B receives request
        |
        v
Shop B accepts request
        |
        v
Product quantity is transferred
        |
        v
Shop A quantity decreases
Shop B quantity increases
Transfer is recorded
```

### Recommended business rules

These are implementation suggestions to make the required workflow safer and clearer; they are not additional requirements explicitly stated in the PDF.

1. Export quantity must be greater than zero.
2. Export quantity must not exceed the source shop's available quantity.
3. A shop should not be able to export to itself.
4. Only the destination shop should be able to accept the request.
5. An already accepted/rejected request should not be processed again.
6. Product quantity should be updated atomically.
7. Every completed transfer should have a persistent transaction/history record.

---

# 7. Suggested Database Design

The assignment provides a **sample ER diagram on page 4** and explicitly says the schema can be improved according to the developer's needs.

The sample includes these main entities:

## Shopkeeper

Sample fields:

- `id` — integer, primary key
- `name` — string
- `email` — string
- `password` — string
- `address` — string
- `showImage` — optional string

## Product

Sample fields:

- `id` — integer, primary key
- `name` — string
- `quantity` — integer
- `description` — string
- `shopkeeperId` — foreign key

## Trade

Sample fields:

- `id` — integer, primary key
- `exportedBy` — integer
- `importedBy` — integer
- `quantity` — integer
- `productId` — integer

The diagram represents shopkeepers, products and trades as the core pieces of the database.

> **Important:** The sample ER diagram is a starting point, not a fixed schema. The assignment explicitly allows you to improve the design.

> **Source:** Assignment PDF, page 4.

---

# 8. Recommended Improved Data Model

The following is a **suggested implementation**, not a literal requirement from the assignment.

For a cleaner production-style design, separate the concept of a shopkeeper from a shop and make export requests explicit.

A possible model is:

```text
Shopkeeper
---------
id
name
email
passwordHash
createdAt
updatedAt

Shop
----
id
shopkeeperId
name
address
imageUrl
createdAt
updatedAt

Product
-------
id
shopId
name
description
quantity
createdAt
updatedAt

TransferRequest
---------------
id
productId
sourceShopId
destinationShopId
quantity
status
createdBy
acceptedBy
createdAt
acceptedAt
completedAt
```

Suggested request statuses:

```text
PENDING
ACCEPTED
REJECTED
COMPLETED
CANCELLED
```

### Why this model can be useful

It separates:

- user/account information
- shop information
- inventory
- transfer workflow

This makes the system easier to extend later.

For the assignment itself, however, the simpler sample structure can also be used.

---

# 9. Suggested ER Diagram

A possible improved ER model can be represented as:

```mermaid
erDiagram
    SHOPKEEPER ||--|| SHOP : owns
    SHOP ||--o{ PRODUCT : contains

    PRODUCT ||--o{ TRANSFER_REQUEST : requested_for

    SHOP ||--o{ TRANSFER_REQUEST : source
    SHOP ||--o{ TRANSFER_REQUEST : destination

    SHOPKEEPER ||--o{ TRANSFER_REQUEST : creates
    SHOPKEEPER ||--o{ TRANSFER_REQUEST : accepts

    SHOPKEEPER {
        int id PK
        string name
        string email
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    SHOP {
        int id PK
        int shopkeeperId FK
        string name
        string address
        string imageUrl
    }

    PRODUCT {
        int id PK
        int shopId FK
        string name
        int quantity
        string description
    }

    TRANSFER_REQUEST {
        int id PK
        int productId FK
        int sourceShopId FK
        int destinationShopId FK
        int quantity
        string status
        int createdBy FK
        int acceptedBy FK
        datetime createdAt
        datetime acceptedAt
        datetime completedAt
    }
```

**Note:** The PDF requires the developer to make their own ER diagram for explaining the database.

---

# 10. Dockerization Requirement

The complete application must be containerized.

The assignment asks for:

## A. Dockerize frontend

Reference:
https://www.bacancytechnology.com/blog/dockerize-react-app

The frontend should run inside its own container.

---

## B. Dockerize backend

Provided resources:

https://dev.to/erezhod/setting-up-a-nestjs-project-with-docker-for-back-end-development-30lg

https://dev.to/abbasogaji/how-to-dockerize-your-nestjs-app-for-production-2lmf

The NestJS API should run inside its own container.

---

## C. Dockerize PostgreSQL

Reference:

https://docs.docker.com/samples/postgresql_service/

The PostgreSQL database should run inside its own container.

---

## D. Docker Compose

Compose the complete system using Docker Compose.

Reference:

https://docs.docker.com/compose/

Additional example:

https://github.com/nadavpodjarski/postgres-nest-react-typescript-boilerplate

### Suggested final container structure

```text
Docker Compose
│
├── frontend
│   └── React + TypeScript
│
├── backend
│   └── NestJS + TypeScript
│
└── postgres
    └── PostgreSQL
```

The containers should communicate through the Docker Compose network.

---

# 11. Git & GitHub Expectations

The assignment explicitly emphasizes a collaborative and maintainable Git workflow.

## Required practices

### Clean and well-commented code

Write clean and readable code.

The assignment specifically says:

> Write clean and well commented code. (Don't over comment)

Comments should explain non-obvious reasoning rather than every line of code.

---

### Regular commits

Push regular commits to Git.

The preferred provider in the assignment is:

**GitHub**

---

### Feature branches

Try to create separate branches for different features.

Suggested branch examples:

```text
feature/authentication
feature/products
feature/export-request
feature/transfer
feature/docker
feature/frontend
```

---

### Meaningful commit messages

Commit messages should describe the actual change.

Examples:

```text
feat: add shopkeeper authentication
feat: add product CRUD APIs
feat: implement product export requests
feat: process accepted product transfers
feat: add docker compose configuration
fix: prevent transfer quantity from exceeding stock
```

Provided resource:
https://www.freecodecamp.org/news/how-to-write-better-git-commit-messages/

---

# 12. TypeScript Coding Standards

The assignment specifically asks developers to:

- Use TypeScript typings.
- Prefer not to use `any`.

### Recommended practice

Prefer explicit interfaces, types and DTOs.

For example:

```ts
interface Product {
  id: number;
  name: string;
  quantity: number;
  description: string;
  shopId: number;
}
```

For NestJS APIs, use DTOs for request validation rather than accepting arbitrary objects.

Example structure:

```text
products/
├── dto/
│   ├── create-product.dto.ts
│   └── update-product.dto.ts
├── products.controller.ts
├── products.service.ts
└── products.module.ts
```

This decomposition follows the assignment's preference for keeping large code blocks out of a single file.

> **Source:** Assignment PDF, page 3.

---

# 13. Code Organization / Decomposition

The assignment specifically recommends:

> Prefer decomposition of code blocks, do not keep a lot of code in a single file.

The goal is to make the code:

- more readable
- easier to maintain
- easier to contribute to
- easier to review

### Suggested backend structure

```text
src/
├── auth/
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── shopkeepers/
│   ├── dto/
│   ├── shopkeepers.controller.ts
│   ├── shopkeepers.service.ts
│   └── shopkeepers.module.ts
│
├── shops/
│   ├── shops.controller.ts
│   ├── shops.service.ts
│   └── shops.module.ts
│
├── products/
│   ├── dto/
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
│
├── transfers/
│   ├── dto/
│   ├── transfers.controller.ts
│   ├── transfers.service.ts
│   └── transfers.module.ts
│
├── prisma/              # or the selected ORM module/config
└── main.ts
```

### Suggested frontend structure

```text
src/
├── components/
├── pages/
├── layouts/
├── services/
├── hooks/
├── types/
├── context/
├── utils/
├── routes/
└── App.tsx
```

The exact structure can differ, but the important principle is to avoid putting the whole application into a few large files.

---

# 14. Authentication & Authorization Suggestions

The assignment requires authentication but does not prescribe every authorization rule.

A sensible implementation is:

```text
Signup
  ↓
Login
  ↓
Authentication Token
  ↓
Authenticated requests
  ↓
Backend identifies shopkeeper
  ↓
Authorization checks ownership
```

### Recommended protections

- Hash passwords before storing them.
- Never return password/password-hash fields in normal API responses.
- Protect product mutation endpoints.
- Protect export creation.
- Protect request acceptance.
- Verify that the current shopkeeper owns the source shop.
- Verify that the current shopkeeper is the destination shop before accepting a request.

These are implementation recommendations to make the required feature secure.

---

# 15. Product Transfer Consistency

A key part of this assignment is transferring inventory between shops.

The transfer should be treated as a single business operation.

### Example

Initial inventory:

```text
Shop A
Product X = 50

Shop B
Product X = 10
```

Transfer request:

```text
Shop A → Shop B
Product X
Quantity = 15
```

After successful transfer:

```text
Shop A
Product X = 35

Shop B
Product X = 25
```

### Important edge cases to handle

These are recommended edge cases for the existing required functionality:

```text
1. Export quantity <= 0
2. Export quantity > source stock
3. Source shop and destination shop are the same
4. Non-existent product
5. Non-existent destination shop
6. Export request already processed
7. Unauthorized user trying to create an export
8. Unauthorized user trying to accept an export
9. Concurrent requests attempting to consume the same stock
10. Database failure during transfer
```

### Strong recommendation

Use a database transaction for the actual inventory movement so the source and destination quantities do not become inconsistent.

---

# 16. API Design Suggestion

The PDF specifies the required API capabilities but does not specify exact routes.

A reasonable REST structure could be:

## Authentication

```text
POST /auth/register
POST /auth/login
```

## Shops

```text
GET /shops
GET /shops/:shopId
```

## Products

```text
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

## Transfer requests

```text
POST /transfers
GET  /transfers
GET  /transfers/:id
POST /transfers/:id/accept
POST /transfers/:id/reject
```

The `reject` endpoint is an optional workflow improvement. The assignment explicitly requires accepting export requests, but does not explicitly require rejection.

---

# 17. Validation Suggestions

Use proper validation on incoming data.

Examples:

### Signup

```text
name       → required
email      → valid email
password   → required and validated
address    → required
```

### Product

```text
name        → required
quantity    → integer >= 0
description → optional/required according to your design
```

### Transfer request

```text
productId          → required
destinationShopId  → required
quantity           → integer > 0
```

For NestJS, DTO-based validation is a good fit.

---

# 18. Frontend UX Suggestions

The assignment's required pages can be connected into a simple flow.

### Public user

```text
Home
  ↓
List of shops
  ↓
Shop details
  ↓
Products
```

### Shopkeeper

```text
Login / Signup
       ↓
Dashboard
   ┌───┼───────────────┐
   ↓   ↓               ↓
Products   Export Requests   Profile
   ↓            ↓
Add/Edit     Accept Request
Product          ↓
                 Transfer completed
```

### Useful UI states

Every API-driven page should account for:

```text
Loading
Success
Empty state
Validation error
API/server error
Unauthorized
Not found
```

This is a recommended UI quality improvement.

---

# 19. Optional Features Mentioned in the Assignment

The PDF lists file uploading as an optional topic.

## Optional 1 — File uploading in NestJS

Reference:

https://docs.nestjs.com/techniques/file-upload

This can be used for shop images or other files.

---

## Optional 2 — Store files in PostgreSQL

Reference:

https://wanago.io/2021/11/01/api-nestjs-storing-files-postgresql-database/

The assignment specifically suggests learning how to store files in PostgreSQL.

> These features are optional and are not required for the core assignment.

---

# 20. Learning Resources Provided by the Assignment

## TypeScript

https://www.w3schools.com/typescript/index.php

## React

https://reactjs.org/docs/getting-started.html

https://www.codecademy.com/learn/react-101

https://www.sitepoint.com/react-with-typescript-best-practices/

## NestJS

https://docs.nestjs.com/

https://www.digitalocean.com/community/tutorials/getting-started-with-nestjs

## Optional file upload

https://docs.nestjs.com/techniques/file-upload

## Optional PostgreSQL file storage

https://wanago.io/2021/11/01/api-nestjs-storing-files-postgresql-database/

---

# 21. Assignment-Specific Rules — Must Follow

The following points are explicitly emphasized in the assignment:

### Code quality

- Write clean code.
- Add useful comments, but do not over-comment.
- Decompose code instead of keeping large blocks in one file.
- Use TypeScript typings.
- Prefer not to use `any`.

### Git

- Push regular commits.
- Prefer GitHub.
- Use separate branches for different features when possible.
- Use meaningful commit messages.

### Originality

The assignment permits freely referring to online resources, but the **implemented solution must be your own**.

Do not copy another person's implementation in a way that makes it appear to be your work.

### Database documentation

You **must create your own ER diagram** explaining your database.

> **Source:** Assignment PDF, page 3.

---

# 22. Recommended Project Milestones

This section converts the assignment into a practical implementation sequence.

## Milestone 1 — Project setup

```text
[ ] Create GitHub repository
[ ] Initialize React + TypeScript frontend
[ ] Initialize NestJS + TypeScript backend
[ ] Set up PostgreSQL
[ ] Select ORM
[ ] Configure environment variables
[ ] Establish frontend ↔ backend communication
```

---

## Milestone 2 — Database

```text
[ ] Design database
[ ] Create ER diagram
[ ] Create shopkeeper/shop model
[ ] Create product model
[ ] Create transfer/trade model
[ ] Create migrations
[ ] Seed development data if useful
```

---

## Milestone 3 — Authentication

```text
[ ] Signup API
[ ] Login API
[ ] Password hashing
[ ] Authentication strategy
[ ] Protected routes
[ ] Frontend login/signup screens
[ ] Store authentication state
[ ] Handle logout
```

---

## Milestone 4 — Shops

```text
[ ] GET all shops
[ ] Shop listing page
[ ] Shop/product navigation
[ ] Shopkeeper profile/shop information
```

---

## Milestone 5 — Products

```text
[ ] Create product
[ ] List products
[ ] View product
[ ] Update product
[ ] Delete product
[ ] Ownership validation
[ ] Product UI
```

---

## Milestone 6 — Transfers

```text
[ ] Create export request
[ ] View incoming requests
[ ] View outgoing requests
[ ] Accept request
[ ] Validate stock
[ ] Update inventory
[ ] Record transfer
[ ] Prevent duplicate processing
[ ] Use database transaction for the movement
```

---

## Milestone 7 — Docker

```text
[ ] Dockerfile for frontend
[ ] Dockerfile for backend
[ ] PostgreSQL container
[ ] Docker Compose configuration
[ ] Environment variables
[ ] Service-to-service networking
[ ] Database persistence
[ ] Verify clean startup from Docker Compose
```

---

## Milestone 8 — Quality & submission

```text
[ ] Test required flows
[ ] Test edge cases
[ ] Improve error handling
[ ] Check TypeScript types
[ ] Remove unnecessary `any`
[ ] Review code organization
[ ] Add README
[ ] Add ER diagram
[ ] Add setup instructions
[ ] Add meaningful Git history
[ ] Verify Docker Compose setup
```

---

# 23. Recommended README Content

Although not explicitly listed as a requirement, a strong submission should include a README containing:

```text
1. Project overview
2. Problem being solved
3. Architecture
4. Tech stack
5. Project structure
6. Database / ER diagram
7. API list
8. Authentication flow
9. Product transfer flow
10. Environment variables
11. Local setup instructions
12. Docker setup
13. Sample credentials/data (if applicable)
14. Screenshots
15. Known limitations
```

---

# 24. Suggested Environment Variables

The exact variables depend on the selected ORM and authentication implementation.

For example:

```env
DATABASE_URL=postgresql://user:password@postgres:5432/vmarket

JWT_SECRET=your-secret

FRONTEND_URL=http://localhost:3000

PORT=3000
```

Do not commit real secrets to GitHub.

Use a `.env.example` file containing placeholders instead.

---

# 25. Suggested Testing Checklist

## Authentication

```text
[ ] Valid signup
[ ] Duplicate email
[ ] Invalid login
[ ] Valid login
[ ] Unauthorized protected API
```

## Products

```text
[ ] Add product
[ ] View products
[ ] Update own product
[ ] Delete own product
[ ] Attempt to modify another shop's product
[ ] Invalid product quantity
```

## Transfers

```text
[ ] Create valid export
[ ] Export more than available stock
[ ] Export zero quantity
[ ] Export negative quantity
[ ] Export to same shop
[ ] Accept valid request
[ ] Accept another shop's request
[ ] Accept already processed request
[ ] Verify source quantity decreases
[ ] Verify destination quantity increases
[ ] Verify trade/transfer record is created
```

## Infrastructure

```text
[ ] Frontend starts
[ ] Backend starts
[ ] Database starts
[ ] All services communicate through Compose
[ ] Database data survives container restart
```

---

# 26. Overall Architecture

A clean high-level architecture could be:

```text
                    ┌──────────────────────┐
                    │      React App       │
                    │   TypeScript UI      │
                    └──────────┬───────────┘
                               │ HTTP
                               ▼
                    ┌──────────────────────┐
                    │      NestJS API      │
                    │ Controllers / DTOs   │
                    │ Services / Auth      │
                    └──────────┬───────────┘
                               │ ORM
                               ▼
                    ┌──────────────────────┐
                    │      PostgreSQL      │
                    │ Shops / Products /   │
                    │ Transfer Requests    │
                    └──────────────────────┘

                 All services containerized with
                       Docker Compose
```

---

# 27. What Should Be Demonstrable at the End

A reviewer should be able to see the complete business flow:

```text
1. Register Shopkeeper A
2. Register Shopkeeper B
3. See both shops on the home page
4. Add products to Shop A
5. View Shop A's products
6. Create a transfer/export request from Shop A to Shop B
7. Login as Shop B
8. See the incoming request
9. Accept the request
10. Verify inventory moved
11. Verify the transfer/trade was recorded
12. Run the whole application through Docker Compose
```

This is the most important end-to-end demonstration of the assignment's core idea.

---

# 28. Final Submission Checklist

## Functional requirements

- [ ] Shopkeeper signup
- [ ] Shopkeeper login/authentication
- [ ] Home page listing shops
- [ ] Shop product listing
- [ ] Add product
- [ ] Product CRUD
- [ ] Export request
- [ ] Accept export request
- [ ] Product transfer between shops

## Backend

- [ ] NestJS
- [ ] TypeScript
- [ ] PostgreSQL
- [ ] ORM
- [ ] Required APIs
- [ ] Authentication
- [ ] Validation
- [ ] Authorization/ownership checks

## Frontend

- [ ] React + TypeScript
- [ ] Required pages
- [ ] API integration
- [ ] Loading/error/empty states
- [ ] Authenticated user flow

## Docker

- [ ] Frontend Dockerfile
- [ ] Backend Dockerfile
- [ ] PostgreSQL container
- [ ] Docker Compose
- [ ] Persistent database volume

## Code quality

- [ ] Clean code
- [ ] Useful comments
- [ ] No unnecessary `any`
- [ ] Strong TypeScript typings
- [ ] Decomposed modules/files

## Git

- [ ] GitHub repository
- [ ] Regular commits
- [ ] Feature branches where appropriate
- [ ] Meaningful commit messages
- [ ] Original implementation

## Documentation

- [ ] ER diagram
- [ ] README
- [ ] Setup instructions
- [ ] API documentation
- [ ] Docker instructions

## Optional

- [ ] File upload
- [ ] File storage in PostgreSQL

---

# 29. Important Distinction: Assignment Requirements vs. Recommendations

### Explicitly required by the PDF

The core requirements are:

- React + TypeScript frontend
- NestJS + TypeScript backend
- PostgreSQL database
- One ORM
- Shop listing
- Shop product listing
- Shopkeeper signup/login
- Add product
- Export product request
- Accept export request
- Transfer product between shops
- Required backend APIs
- Dockerize frontend
- Dockerize backend
- Dockerize PostgreSQL
- Docker Compose
- Clean/commented code
- Regular Git commits
- Feature branches where possible
- Meaningful commits
- Original implementation
- Code decomposition
- TypeScript typings / avoid `any`
- Own ER diagram

### Recommended enhancements in this document

The following were added as practical implementation guidance rather than requirements explicitly stated in the PDF:

- Explicit transfer-request status values
- Reject/cancel workflow
- Database transactions
- Additional validation rules
- Ownership/authorization checks
- REST route examples
- Recommended project structures
- Error/loading/empty UI states
- Testing checklist
- README structure
- Environment variable examples
- End-to-end acceptance flow
- Improved ER model separating Shopkeeper, Shop, Product and TransferRequest

These recommendations should support the assignment rather than change its core scope.

---

# 30. Primary References From the Assignment PDF

### NestJS
https://nestjs.com/

https://docs.nestjs.com/first-steps

https://docs.nestjs.com/techniques/database

https://docs.nestjs.com/security/authentication

https://docs.nestjs.com/recipes/crud-generator

### React
https://reactjs.org/

https://create-react-app.dev/docs/adding-typescript/

### TypeScript
https://www.typescriptlang.org/

https://www.w3schools.com/typescript/index.php

### PostgreSQL
https://www.postgresql.org/

### ORM
https://sequelize.org/

https://www.prisma.io/

https://typeorm.io/

### Docker
https://www.docker.com/

https://docs.docker.com/samples/postgresql_service/

https://docs.docker.com/compose/

### Git
https://git-scm.com/

https://www.freecodecamp.org/news/how-to-write-better-git-commit-messages/

### Additional assignment resources
https://www.codecademy.com/learn/react-101

https://www.sitepoint.com/react-with-typescript-best-practices/

https://www.digitalocean.com/community/tutorials/getting-started-with-nestjs

https://github.com/nadavpodjarski/postgres-nest-react-typescript-boilerplate

### Optional file upload/storage
https://docs.nestjs.com/techniques/file-upload

https://wanago.io/2021/11/01/api-nestjs-storing-files-postgresql-database/
