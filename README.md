# InvoicePro — Backend API

REST API for the InvoicePro invoicing platform: company profiles, customers, item
catalogues, GST-aware invoice generation (CGST / SGST / IGST), reporting aggregates, and a
subscription layer that gates invoice creation.

Express 5 on Node.js (ESM), Prisma 6 over PostgreSQL, with authentication delegated to
Supabase Auth.

> **Companion repository —** the React web client lives at
> [rupeshv2121/invoice_generator](https://github.com/rupeshv2121/invoice_generator).
> The two are deployed independently; this repo is the only one that talks to the database.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Stack](#stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Request Lifecycle](#request-lifecycle)
- [Authentication](#authentication)
- [Subscription Layer](#subscription-layer)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Core Pipelines](#core-pipelines)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Known Gaps](#known-gaps)

---

## System Architecture

Three tiers, plus Supabase as an external identity provider. This API is the only component
that holds a database credential; the browser never does.

```mermaid
flowchart TB
    subgraph Client["Web client (separate repo)"]
        UI["React SPA — Vite, Tailwind"]
        AXIOS["axios + Bearer JWT"]
        UI --> AXIOS
    end

    subgraph Supabase["Supabase (managed)"]
        SBAUTH["Auth — users, JWT issuance"]
        SBPG[("PostgreSQL")]
    end

    subgraph Server["This repository — Express 5 API"]
        MW["Middleware: CORS, JSON, cookies"]
        AUTH["supabaseAuth — token verify + user auto-provision"]
        SUBMW["Subscription guards"]
        ROUTES["Routers: auth, company, customer, item,<br/>invoice, settings, subscription"]
        DTO["Zod DTO validation"]
        SVC["SubscriptionService / invoiceUtils"]
        ERR["errorHandler"]
        MW --> AUTH --> SUBMW --> ROUTES --> DTO --> SVC
        ROUTES --> ERR
    end

    AXIOS -- "HTTPS + Bearer JWT" --> MW
    ROUTES -- "admin + token APIs" --> SBAUTH
    AUTH -- "getUser(token)" --> SBAUTH
    SVC -- "Prisma Client" --> SBPG
    ROUTES -- "Prisma Client" --> SBPG
```

**Design notes**

- **Supabase Auth is the identity source of truth.** This API stores only a thin `User` row
  keyed by the Supabase user id (`authId`); passwords never touch these tables.
- **`CompanyProfile` is the tenancy boundary.** Customers, items, invoices, and settings all
  hang off a company profile, and list queries are scoped through it, so one user does not
  see another's data.
- **Money is `Decimal`, not float.** Amounts use `DECIMAL(12,2)` and tax rates
  `DECIMAL(5,2)` to avoid rounding drift.
- **Invoice writes are transactional.** Header and line items are created in a single
  `prisma.$transaction`, so a half-written invoice is not possible.
- **The server never trusts client-supplied totals.** Every amount is recomputed on write.

---

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 18+, ES modules (`"type": "module"`) |
| Framework | Express 5 |
| ORM | Prisma 6 (`prisma-client-js`) |
| Database | PostgreSQL (Supabase-hosted) |
| Auth | Supabase Auth (`@supabase/supabase-js`), bearer JWT |
| Validation | Zod 4 |
| Misc | `cors`, `cookie-parser`, `dotenv`, `bcrypt`, `jsonwebtoken`, `axios` |

---

## Project Structure

```
invoice_generator_server/
├── prisma/
│   ├── schema.prisma              # single source of truth for the data model
│   └── migrations/                # 14 ordered migrations
├── src/
│   ├── index.js                   # app bootstrap, middleware chain, route mounting
│   ├── routes/
│   │   ├── auth.js                # register, login, me
│   │   ├── company.js             # company profile CRUD
│   │   ├── customer.js            # customer CRUD, stats
│   │   ├── item.js                # item catalogue CRUD, stats, autocomplete
│   │   ├── invoice.js             # invoice CRUD (subscription-gated create)
│   │   ├── settings.js            # per-company settings + reporting endpoints
│   │   └── subscription.js        # plans, trial, status, cancel
│   ├── middleware/
│   │   ├── auth.js                # supabaseAuth, requireRole
│   │   ├── subscriptionMiddleware.js
│   │   └── errorHandler.js
│   ├── services/
│   │   └── subscriptionService.js # plan catalogue, limits, lifecycle
│   ├── dto/                       # Zod schemas per resource
│   ├── utils/
│   │   ├── prismaClient.js
│   │   ├── supabaseClient.js
│   │   └── invoiceUtils.js        # numbering, totals, currency formatting
│   └── generated/prisma/          # committed Prisma Client output
└── vercel.json                    # all routes → src/index.js via @vercel/node
```

---

## Getting Started

**Prerequisites:** Node.js 18+, a PostgreSQL database, and a Supabase project (its Auth
service is required regardless of where Postgres lives).

```bash
git clone https://github.com/rupeshv2121/invoice_generator_server.git
cd invoice_generator_server
npm install
# create .env — see Environment Variables below
npm run db:generate        # generate Prisma Client into src/generated/prisma
npm run db:migrate         # apply migrations to your database
npm run dev                # watch mode on http://localhost:3001
```

Smoke test:

```bash
curl http://localhost:3001/health
# {"status":"OK","message":"Invoice Generator Server is running!"}
```

To run the full stack locally, clone the client repo alongside this one, point its
`VITE_API_URL` at `http://localhost:3001`, and set `FRONTEND_URL` here to the client origin.

---

## Environment Variables

Create `.env` in the repository root:

```env
# Database (Prisma)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"

# Supabase
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# Server
PORT=3001
NODE_ENV=development

# CORS — must match the client origin exactly, no trailing slash
FRONTEND_URL="http://localhost:5173"

# Dev only: create users pre-confirmed and return a session immediately
AUTH_AUTOCONFIRM=true
```

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Runtime connection. Use the pooled/pgbouncer endpoint in serverless deploys. |
| `DIRECT_URL` | yes | Non-pooled connection Prisma uses for migrations and introspection. |
| `SUPABASE_URL` | yes | Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Full-privilege key used for `auth.getUser()` and `auth.admin.createUser()`. **Never ship this to a browser.** |
| `FRONTEND_URL` | yes | Single allowed CORS origin; `credentials: true` is enabled. A trailing slash breaks preflight. |
| `PORT` | no | Defaults to `3001`. |
| `NODE_ENV` | no | `development` includes real error messages in 500 responses. |
| `AUTH_AUTOCONFIRM` | no | Defaults to **true** whenever `NODE_ENV !== production`. Bypasses Supabase email confirmation, which does not deliver to non-team addresses on local projects. Set `false` in any shared environment. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | no | Reserved for invoice email; no code path uses them yet. |

`.env` is git-ignored — never commit real keys.

---

## Scripts

| Script | Action |
| --- | --- |
| `npm start` | `node src/index.js` |
| `npm run dev` | `node --watch src/index.js` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | `prisma db push` — sync schema without a migration |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | `prisma studio` — browse data |
| `npm run db:seed` | `node prisma/seed.js` — **note: `prisma/seed.js` does not exist yet** |

---

## Request Lifecycle

```mermaid
flowchart LR
    REQ["Incoming request"] --> CORS["cors(FRONTEND_URL)"]
    CORS --> BODY["express.json + urlencoded + cookieParser"]
    BODY --> PUB{"public route?"}
    PUB -- "/health, /api/auth/*" --> H["handler"]
    PUB -- "everything else" --> SA["supabaseAuth"]
    SA -- "no / bad token" --> E401["401"]
    SA -- "valid" --> PROV["auto-provision User row"]
    PROV --> GUARD{"route guards"}
    GUARD -- "requireActiveSubscription / checkInvoiceLimit" --> ZOD["Zod DTO validation"]
    ZOD -- invalid --> E400["400 + details"]
    ZOD -- valid --> H
    H --> DB[("Prisma → PostgreSQL")]
    H --> RES["JSON response"]
    H -. "next(err)" .-> EH["errorHandler"]
    EH --> RES
```

Middleware order in [`src/index.js`](src/index.js):

```
cors(FRONTEND_URL, credentials) → express.json → urlencoded → cookieParser
  → /health                      (public)
  → /api/auth/*                  (public)
  → supabaseAuth → /api/{company,customer,item,invoice,settings,subscription}
  → errorHandler → 404 fallback
```

| Prefix | Router | Auth |
| --- | --- | --- |
| `/health` | inline | public |
| `/api/auth` | `routes/auth.js` | public |
| `/api/company` | `routes/company.js` | `supabaseAuth` |
| `/api/customer` | `routes/customer.js` | `supabaseAuth` |
| `/api/item` | `routes/item.js` | `supabaseAuth` |
| `/api/invoice` | `routes/invoice.js` | `supabaseAuth` (+ subscription guards on create) |
| `/api/settings` | `routes/settings.js` | `supabaseAuth` |
| `/api/subscription` | `routes/subscription.js` | `supabaseAuth` |

A `SIGINT` handler disconnects Prisma before the process exits.

---

## Authentication

Supabase Auth owns credentials and issues the JWT. This API only verifies tokens and keeps
a local `User` row so domain records have a foreign key to point at.

```mermaid
sequenceDiagram
    participant C as Client
    participant A as This API
    participant S as Supabase Auth
    participant D as PostgreSQL

    C->>A: POST /api/auth/login {email, password}
    A->>S: signInWithPassword()
    S-->>A: session {access_token, refresh_token}
    A->>D: upsert User (authId)
    A-->>C: {user, access_token}

    C->>A: GET /api/invoice (Authorization: Bearer token)
    A->>S: supabase.auth.getUser(token)
    alt invalid or expired
        S-->>A: error
        A-->>C: 401 Invalid or expired token
    else valid
        S-->>A: user
        A->>D: auto-provision User row if missing
        A->>D: query scoped by companyProfileId
        D-->>A: rows
        A-->>C: 200 JSON
    end
```

**`supabaseAuth`** ([`src/middleware/auth.js`](src/middleware/auth.js)):

1. Requires an `Authorization: Bearer <token>` header — `401 No token provided` / `401 Malformed token` otherwise.
2. Calls `supabase.auth.getUser(token)` — `401 Invalid or expired token` on failure.
3. Attaches the Supabase user to `req.user`.
4. Auto-provisions a local `User` row (`id` = `authId` = Supabase user id) if none exists. Provisioning failures are logged but do not block the request.

**`requireRole(roles)`** exists as a role gate but is not currently attached to any route.

### Registration flow

`POST /api/auth/register` branches on `AUTH_AUTOCONFIRM`:

- **On (default outside production):** `supabase.auth.admin.createUser({ email_confirm: true })`, then an immediate `signInWithPassword()` so the response carries a usable session. This exists because Supabase's built-in mailer refuses to deliver confirmation links to addresses outside the project team, which makes local signup untestable.
- **Off:** the standard `supabase.auth.signUp()` flow. `access_token` may be `null` until the user confirms by email.

Either way the user metadata (`fullName`, `phone`, `companyName`, `gstRegistered`, `gstin`)
is stored on the Supabase user, and `syncUserRecord()` upserts the local `User` row.

---

## Subscription Layer

[`SubscriptionService`](src/services/subscriptionService.js) is the single place plan rules
live.

| Method | Purpose |
| --- | --- |
| `hasActiveSubscription(userId)` | Time-aware active check — `TRIAL` before `trialEndDate`, `ACTIVE` before `endDate` |
| `getSubscription(userId)` | Subscription record plus derived `isActive` and `daysRemaining` |
| `getDaysRemaining(subscription)` | Whole days until trial or plan expiry, floored at 0 |
| `createTrialSubscription(userId)` | 7-day `FREE`/`TRIAL` record; throws if one already exists |
| `activateSubscription(userId, plan, paymentId)` | Upserts a 1-month `ACTIVE` plan with that plan's limits |
| `getPlanDetails(plan)` / `getAllPlans()` | Plan catalogue — price, limits, feature list |
| `canCreateInvoice(userId)` | Active **and** under the invoice limit |
| `incrementInvoiceUsage(userId)` | Bumps `invoicesUsed`; no-op when unlimited |
| `getRemainingInvoices(userId)` | `invoiceLimit - invoicesUsed`, `Infinity` when unlimited |
| `expireSubscription` / `cancelSubscription` | Status transitions |

**Plans** (`-1` = unlimited):

| Plan | ₹/month | Invoices | Customers | Items |
| --- | ---: | ---: | ---: | ---: |
| `FREE` (7-day trial) | 0 | 10 | 50 | 100 |
| `BASIC` | 499 | 100 | 200 | 500 |
| `PROFESSIONAL` | 999 | ∞ | ∞ | ∞ |
| `ENTERPRISE` | 2499 | ∞ | ∞ | ∞ |

**Guards** ([`subscriptionMiddleware.js`](src/middleware/subscriptionMiddleware.js)):

| Guard | Applied to | Failure |
| --- | --- | --- |
| `requireActiveSubscription` | `POST /api/invoice` | `403 { code: "SUBSCRIPTION_REQUIRED" }` |
| `checkInvoiceLimit` | `POST /api/invoice` | `403 { code: "LIMIT_REACHED", remaining }` |
| `checkCustomerLimit` | *(defined, not mounted)* | — |
| `checkItemLimit` | *(defined, not mounted)* | — |

---

## Database Schema

Full definition in [`prisma/schema.prisma`](prisma/schema.prisma). All ids are UUIDs; all
tables are snake_cased via `@@map`; every model carries `createdAt` / `updatedAt`.

```mermaid
erDiagram
    User ||--o| CompanyProfile : owns
    User ||--o| Subscription : has
    User ||--o{ Payment : makes
    User ||--o{ Invoice : issues
    CompanyProfile ||--o| Settings : configures
    CompanyProfile ||--o{ Customer : manages
    CompanyProfile ||--o{ Item : catalogues
    CompanyProfile ||--o{ Invoice : bills_from
    Customer ||--o{ Invoice : billed_to
    Invoice ||--o{ InvoiceItem : contains
    Item ||--o{ InvoiceItem : referenced_by
```

### `User` → `users`
`id`, `authId` (unique, Supabase id), `role` (default `USER`). Relations: `company`,
`invoices`, `subscription`, `payments`.

### `CompanyProfile` → `company_profiles`
One per user (`userId` unique, cascade delete). Identity: `fullName`, `phone`, `email`,
`website`, `companyName`. Compliance: `gstRegistered`, `gstin`, `pan`, `iecCode`, `arn`.
Address: `address`, `city`, `state`, `pincode`, `country` (default `India`). Banking:
`bankName`, `bankAccountNumber`, `bankIfscCode`, `bankBranch`. Plus `logoPath`, `isActive`.

### `Customer` → `customers`
`name`, `companyName`, address block, `phone`, `email`, `EximCode`, `gstin`, `pan`,
`isActive`, optional `companyProfileId` (cascade delete).

### `Item` → `items`
`name`, `description`, `hsnCode` (Int), `unit` (default `pcs`), `purchasePrice`,
`sellingPrice` (`Decimal(10,2)`), `cgstRate` / `sgstRate` / `igstRate` (`Decimal(5,2)`),
`isActive`, optional `companyProfileId` (cascade delete).

### `Invoice` → `invoices`
`invoiceNumber` (unique), `invoiceDate`, `dueDate`, and shipping metadata `marka`,
`dateOfSupply`, `stateCode`, `transportation`. Totals as `Decimal(12,2)`: `subtotal`,
`cgstAmount`, `sgstAmount`, `igstAmount`, `totalAmount`. Plus `amountInWords`, `notes`,
`status` (default `DRAFT`). FKs: `userId`, `companyProfileId`, `customerId`.

### `InvoiceItem` → `invoice_items`
Line snapshot: `description`, `hsnCode`, `unit`, `quantity` and `rate` (`Decimal(10,2)`),
`amount`, per-line rates (defaults 9 / 9 / 18) and amounts, `totalAmount`. `invoiceId`
cascades on delete; `itemId` is optional so ad-hoc lines are allowed and catalogue edits do
not rewrite history.

### `Settings` → `settings`
One per company (`companyProfileId` unique, cascade delete). `invoicePrefix` (default
`INV`), `nextInvoiceNumber` (default `1`), `defaultCgstRate` / `defaultSgstRate` /
`defaultIgstRate` (9 / 9 / 18), `termsConditions`.

### `Subscription` → `subscriptions`
One per user. `plan`, `status`, `startDate`, `endDate`, `trialEndDate`, `paymentMethod`,
`lastPaymentDate`, `nextBillingDate`, `amount`, `currency` (default `INR`), and the limit
counters `invoiceLimit`, `invoicesUsed`, `customersLimit`, `itemsLimit`. Indexed on
`userId` and `status`.

### `Payment` → `payments`
`amount`, `currency`, `status`, `paymentMethod`, `transactionId` (unique), plus
`razorpayOrderId` / `razorpayPaymentId` / `razorpaySignature`. Indexed on `userId` and
`status`. **No route currently writes to this table.**

### Enums
- `SubscriptionPlan` — `FREE`, `BASIC`, `PROFESSIONAL`, `ENTERPRISE`
- `SubscriptionStatus` — `TRIAL`, `ACTIVE`, `EXPIRED`, `CANCELLED`, `SUSPENDED`
- `PaymentStatus` — `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

Invoice `status` is a plain string validated by Zod, not a database enum:
`DRAFT` | `SENT` | `PAID` | `OVERDUE` | `CANCELLED`.

---

## API Reference

Base URL: `http://localhost:3001` (dev). Every route below except `/health` and
`/api/auth/*` requires `Authorization: Bearer <supabase_access_token>`.

### Health

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/health` | `{ status: "OK", message: "..." }` |

### Auth — `/api/auth`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/register` | `email`, `password`, `name`/`fullName`, `phone?`, `companyName?`, `gstRegistered?`, `gstin?` | `201` `{ message, user, access_token, refresh_token }` |
| `POST` | `/login` | `email`, `password` | `200` `{ message, user, access_token, refresh_token }` — `401` on bad credentials |
| `GET` | `/me` | — (bearer token) | current Supabase user |

### Company — `/api/company`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | The authenticated user's company profile(s) |
| `GET` | `/:id` | Single company profile |
| `POST` | `/` | Create the company profile (onboarding) |
| `PATCH` | `/:id` | Partial update |
| `DELETE` | `/:id` | Delete — cascades to customers, items, settings |

### Customers — `/api/customer`

| Method | Path | Query / Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/stats` | — | Aggregate customer counts |
| `GET` | `/` | `search`, `page`, `limit`, filters | Paginated list scoped to the company |
| `GET` | `/:id` | — | Single customer, with invoice history |
| `POST` | `/` | customer DTO | Create |
| `PATCH` | `/:id` | partial DTO | Update |
| `DELETE` | `/:id` | — | Delete |

`/stats` is registered before `/:id`, so it resolves correctly.

### Items — `/api/item`

| Method | Path | Query / Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/stats` | — | Catalogue stats |
| `GET` | `/` | `search`, `page`, `limit`, filters | Paginated list |
| `GET` | `/search/autocomplete` | `q`, `companyId` | Typeahead for invoice line entry |
| `POST` | `/` | item DTO | Create |
| `PATCH` | `/:id` | partial DTO | Update |
| `DELETE` | `/:id` | — | Delete |

### Invoices — `/api/invoice`

| Method | Path | Query / Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | `search`, `page` (1), `limit` (10), `status`, `customerId`, `startDate`, `endDate` | Paginated list. Returns `404` if the user has no company profile yet. |
| `GET` | `/:id` | — | Invoice with company, customer, and line items |
| `POST` | `/` | invoice DTO with `invoiceItems[]` | **Guarded** by `requireActiveSubscription` + `checkInvoiceLimit`. Generates the number, recomputes totals, writes header + lines in one transaction, increments usage. `201`. |
| `PUT` | `/:id` | invoice DTO | Full update, totals recomputed |
| `DELETE` | `/:id` | — | Delete — cascades to line items |
| `GET` | `/stats` | — | ⚠️ Registered after `/:id` and therefore unreachable (see [Known Gaps](#known-gaps)) |

### Settings & Reports — `/api/settings`

| Method | Path | Query | Purpose |
| --- | --- | --- | --- |
| `GET` | `/:companyId` | — | Settings for a company; created with defaults if absent |
| `PUT` | `/:companyId` | settings DTO | Update prefix, next number, default tax rates, terms |
| `GET` | `/reports/dashboard` | `companyId?` | Total invoices, total revenue, current vs. last month, recent invoices |
| `GET` | `/reports/revenue` | `companyId?`, `period` (`monthly`), `year?` | Revenue time series |
| `GET` | `/reports/gst` | `companyId?`, `startDate?`, `endDate?` | CGST / SGST / IGST breakdown |

All report queries are scoped by `company.userId = req.user.id`.

### Subscription — `/api/subscription`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/current` | Full subscription with `isActive` and `daysRemaining` |
| `GET` | `/status` | Lightweight: `{ hasActive, status, plan, daysRemaining, invoicesRemaining }` |
| `GET` | `/plans` | Plan catalogue with prices, limits, feature lists |
| `POST` | `/trial` | Start the 7-day trial — `400` if a subscription already exists |
| `POST` | `/cancel` | Set status to `CANCELLED` |

---

## Core Pipelines

### Onboarding

```mermaid
flowchart LR
    R["POST /api/auth/register"] --> SB["Supabase user created<br/>(admin API when AUTH_AUTOCONFIRM)"]
    SB --> U["User row synced (authId)"]
    U --> CP["POST /api/company<br/>CompanyProfile created"]
    CP --> ST["Settings auto-created on first<br/>invoice number request"]
    CP --> TR["POST /api/subscription/trial<br/>7-day FREE trial"]
```

### Invoice creation

```mermaid
flowchart TD
    E["POST /api/invoice"] --> F{"requireActiveSubscription"}
    F -- no --> F1["403 SUBSCRIPTION_REQUIRED"]
    F -- yes --> G{"checkInvoiceLimit"}
    G -- exceeded --> G1["403 LIMIT_REACHED + remaining"]
    G -- ok --> H["Zod validateInvoice()"]
    H -- invalid --> H1["400 + field details"]
    H -- valid --> I["generateInvoiceNumber()<br/>PREFIX-0001 from Settings"]
    I --> J["Recompute per-line amount,<br/>CGST, SGST, IGST, total"]
    J --> K["prisma.transaction:<br/>Invoice + InvoiceItem rows"]
    K --> L["incrementInvoiceUsage()"]
    L --> M["201 invoice + company + customer + items"]
```

**Tax maths** — identical in [`invoiceUtils.js`](src/utils/invoiceUtils.js) and the `POST`
handler:

```
amount      = quantity × rate
cgst        = amount × cgstRate / 100
sgst        = amount × sgstRate / 100
igst        = amount × igstRate / 100
lineTotal   = amount + cgst + sgst + igst
totalAmount = Σ amount + Σ cgst + Σ sgst + Σ igst
```

Defaults are 9% CGST + 9% SGST for intra-state and 18% IGST for inter-state, overridable
per company in `Settings` and per line at entry time. The header stores the sums; the server
always recomputes, so client-supplied totals are ignored.

**Invoice numbering** — [`generateInvoiceNumber(companyProfileId)`](src/utils/invoiceUtils.js)
reads the company's `Settings` (creating it with `INV` / `1` if missing), formats
`` `${prefix}-${next.toString().padStart(4, "0")}` ``, then increments the counter. On any
error it falls back to `INV-<timestamp>` so invoice creation is never blocked by numbering.

> The read-format-increment sequence is not wrapped in a transaction, so two simultaneous
> creates for the same company can contend. `invoiceNumber` is unique at the database level,
> so the loser fails with a `P2002` → `400` rather than producing a duplicate.

### Subscription lifecycle

```mermaid
stateDiagram-v2
    [*] --> TRIAL: POST /subscription/trial (7 days)
    TRIAL --> ACTIVE: plan activated (paid)
    TRIAL --> EXPIRED: trialEndDate passed
    ACTIVE --> EXPIRED: endDate passed
    ACTIVE --> CANCELLED: POST /subscription/cancel
    EXPIRED --> ACTIVE: renewal
    CANCELLED --> [*]
```

`hasActiveSubscription()` is time-aware: a `TRIAL` counts as active only before
`trialEndDate`, an `ACTIVE` plan only before `endDate`. `invoiceLimit: -1` means unlimited
and short-circuits both the limit check and the usage increment.

### Currency and formatting

`formatCurrency()` uses `Intl.NumberFormat("en-IN", { currency: "INR" })` for Indian digit
grouping. Amount-in-words conversion (Crore / Lakh / Thousand) happens client-side during
PDF generation; the `Invoice.amountInWords` column stores the result.

---

## Validation

Zod schemas live in [`src/dto/`](src/dto) — one per resource (`companyDto`, `customerDto`,
`invoiceDto`, `itemDto`, `settingsDto`, `userDto`). Each exports a schema plus
`validateX()` / `validateXUpdate()` helpers built on `safeParse`, so handlers return
structured field errors rather than throwing.

Invoice rules, as an example:

```js
customerId    // uuid, required
invoiceDate   // string | Date → coerced to Date
status        // DRAFT | SENT | PAID | OVERDUE | CANCELLED, default DRAFT
invoiceItems  // at least one line
  description // required, non-empty
  quantity    // positive number
  rate        // positive number
  cgstRate    // 0..50, default 9
  sgstRate    // 0..50, default 9
  igstRate    // 0..50, default 18
```

Failures respond `400 { error: "Validation failed", details: [...] }`.

---

## Error Handling

[`errorHandler`](src/middleware/errorHandler.js) is the terminal middleware; an unmatched
path falls through to a `404 { error: "Route not found" }`.

| Condition | Status | Body |
| --- | --- | --- |
| Prisma `P2002` (unique violation) | 400 | `Duplicate entry` |
| Prisma `P2025` (record missing) | 404 | `Record not found` |
| `ValidationError` | 400 | `Validation error` |
| `JsonWebTokenError` | 401 | `Invalid token` |
| `TokenExpiredError` | 401 | `Token expired` |
| Anything else | `err.status` or 500 | `Internal server error` — real message only when `NODE_ENV=development` |

---

## Deployment

[`vercel.json`](vercel.json) builds `src/index.js` with `@vercel/node` and routes every
path to it.

```json
{ "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.js" }] }
```

Checklist:

1. Configure all environment variables in the Vercel project (production scope).
2. Use the **pooled** connection string for `DATABASE_URL` — serverless functions exhaust direct connections quickly.
3. Apply migrations from a machine with `DIRECT_URL` set: `npx prisma migrate deploy`.
4. Set `FRONTEND_URL` to the deployed client origin, no trailing slash.
5. Leave `AUTH_AUTOCONFIRM` unset (or `false`) with `NODE_ENV=production` so email confirmation is enforced.
6. Regenerate the Prisma Client for the Linux target rather than shipping the committed Windows engine binary.

---

## Known Gaps

Documented deliberately so they are not rediscovered as bugs. Each is a real inconsistency
in the current code, not a design choice.

| Gap | Detail |
| --- | --- |
| `GET /api/invoice/stats` unreachable | `/:id` is registered first, so `stats` is parsed as an id. Move the `/stats` handler above `/:id` to fix. |
| No `/api/dashboard` router | The client calls `/api/dashboard/stats` and `/api/dashboard/overdue`; the equivalent data lives at `/api/settings/reports/dashboard`. |
| Ownership check disabled on invoice create | The company/customer verification block in `POST /api/invoice` is commented out; both ids are trusted from the body. |
| Customer / item limits unenforced | `checkCustomerLimit` and `checkItemLimit` are never mounted, and read `req.prisma`, which is never set. |
| No payment integration | `Payment` carries Razorpay columns and `activateSubscription()` exists, but nothing exposes them over HTTP. |
| `requireRole` unused | Every authenticated user has identical permissions. |
| Dev auth bypass defaults on | `AUTH_AUTOCONFIRM` is enabled whenever `NODE_ENV !== production`, creating pre-confirmed users. |
| `db:seed` script has no file | `prisma/seed.js` is referenced but absent. |
| Generated client committed | `src/generated/prisma/` includes a Windows `.node` engine; run `npm run db:generate` on other platforms. |
| `routes/auth.js.bak` | Stale backup file still in the tree. |
| No tests | No test runner or test files are configured. |

---

## License

No license file is present. Add one before distributing.
