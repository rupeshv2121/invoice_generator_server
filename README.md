# InvoicePro Backend API# Invoice Generator Server



<div align="center">A comprehensive backend API for managing invoices, customers, items, and company profiles.



![InvoicePro Backend](https://img.shields.io/badge/InvoicePro-Backend%20API-4F46E5?style=for-the-badge&logo=node.js&logoColor=white)## Features



[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)- 🔐 JWT-based authentication

[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)- 🏢 Multi-company support

[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)- 👥 Customer management with search

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)- 📦 Items/Products management

- 🧾 Invoice creation with automatic calculations

*Robust REST API with subscription management, GST compliance, and real-time analytics for invoice generation.*- 📊 Dashboard and reporting APIs

- 🔍 Advanced search and filtering

[Frontend Repo](../invoice_generator) • [API Documentation](#api-documentation) • [Database Schema](#database-schema)- 📈 Revenue and GST reports



</div>## Technology Stack



---- **Node.js** with ES Modules

- **Express.js** - Web framework

## 📋 Table of Contents- **Prisma** - Database ORM

- **MySQL** - Database

- [Overview](#overview)- **JWT** - Authentication

- [Key Features](#key-features)- **Zod** - Input validation

- [Tech Stack](#tech-stack)- **bcrypt** - Password hashing

- [Getting Started](#getting-started)

- [Database Schema](#database-schema)## Quick Start

- [API Documentation](#api-documentation)

- [Middleware](#middleware)### 1. Clone and Install Dependencies

- [Services](#services)

- [Environment Variables](#environment-variables)```bash

- [Scripts](#scripts)cd invoice_generator_server

- [Deployment](#deployment)npm install

```

---

### 2. Environment Setup

## 🎯 Overview

```bash

**InvoicePro Backend API** is the server-side application powering the InvoicePro invoice management system. Built with Node.js, Express, and Prisma ORM, it provides a robust REST API for invoice creation, customer management, subscription handling, and GST compliance calculations.# Copy environment file

cp .env.example .env

### Core Responsibilities

# Edit .env with your database credentials

- ✅ **Authentication**: Validate Supabase JWT tokens and manage user sessions# DATABASE_URL="mysql://username:password@localhost:3306/invoice_generator"

- ✅ **Subscription Management**: Trial creation, plan upgrades, usage tracking```

- ✅ **Invoice CRUD**: Create, read, update, delete invoices with GST calculations

- ✅ **Customer Management**: Store and manage customer data with GST details### 3. Database Setup

- ✅ **Items Catalog**: Product/service inventory management

- ✅ **Dashboard Analytics**: Real-time metrics, charts, and reports```bash

- ✅ **Access Control**: Middleware-based authorization and usage limits# Generate Prisma client

- ✅ **Database Operations**: Prisma ORM with PostgreSQLnpm run db:generate



---# Push schema to database (for development)

npm run db:push

## ✨ Key Features

# OR run migrations (for production)

### 🔐 Authentication & Authorizationnpm run db:migrate

- **Supabase JWT Validation**: Middleware to verify JWT tokens on protected routes```

- **User Extraction**: Automatic user extraction from `Authorization` header

- **Session Management**: Stateless JWT-based authentication### 4. Start the Server

- **CORS Enabled**: Configured for cross-origin requests from frontend

```bash

### 💳 Subscription System# Development mode (with auto-restart)

- **Automated Trial Creation**: Creates 7-day trial on user setup completionnpm run dev

- **Plan Management**: CRUD operations for subscription plans

- **Usage Tracking**: Real-time counters for invoices, customers, items# Production mode

- **Limit Enforcement**: Middleware blocks requests when limits are exceedednpm start

- **Subscription Status**: Active, expired, canceled, trial states```

- **Payment Integration Ready**: Razorpay/Stripe integration prepared

The server will start on `http://localhost:3001`

### 📄 Invoice Management

- **Invoice CRUD**: Full lifecycle management from creation to deletion## API Endpoints

- **GST Auto-calculation**: CGST, SGST, IGST based on customer state

- **PDF Export**: Integration with frontend PDF service### Authentication

- **Status Management**: Draft, sent, paid, overdue, canceled- `POST /api/auth/register` - Register new user

- **Invoice Numbers**: Auto-increment with custom prefix support- `POST /api/auth/login` - Login user

- **Bulk Operations**: Filter, search, pagination support- `GET /api/auth/me` - Get current user

- `POST /api/auth/refresh` - Refresh token

### 👥 Customer Management

- **Customer CRUD**: Complete customer data management### Company Management

- **GST Details**: GSTIN, PAN, state for tax calculations- `GET /api/company` - Get all companies

- **Purchase History**: Track total invoices and revenue per customer- `POST /api/company` - Create company

- **Validation**: GSTIN format validation, duplicate checks- `GET /api/company/:id` - Get company by ID

- **Soft Delete**: Mark customers as inactive instead of hard delete- `PUT /api/company/:id` - Update company

- `DELETE /api/company/:id` - Delete company

### 📦 Items/Products Management- `GET /api/company/profile/main` - Get main company profile

- **Item Catalog**: Manage products and services database

- **Pricing Control**: Rate, tax rate, HSN/SAC codes, units### Customer Management

- **Reusable Templates**: Items can be quickly added to invoices- `GET /api/customer` - Get customers (with search & pagination)

- **Stock Tracking**: Quantity management (optional feature)- `POST /api/customer` - Create customer

- `GET /api/customer/:id` - Get customer by ID

### 📊 Analytics & Reporting- `PUT /api/customer/:id` - Update customer

- **Dashboard Metrics**: Total revenue, invoices, customers, pending payments- `DELETE /api/customer/:id` - Delete customer

- **Monthly Revenue**: Aggregated data for charts- `GET /api/customer/stats/overview` - Get customer statistics

- **GST Summary**: CGST, SGST, IGST breakdown

- **Customer Analytics**: Top customers by revenue### Items Management

- **Payment Reminders**: Overdue invoice tracking- `GET /api/item` - Get items (with search & pagination)

- `POST /api/item` - Create item

---- `GET /api/item/:id` - Get item by ID

- `PUT /api/item/:id` - Update item

## 🛠️ Tech Stack- `DELETE /api/item/:id` - Delete item

- `GET /api/item/search/autocomplete` - Search items for autocomplete

### Runtime & Framework- `GET /api/item/stats/overview` - Get item statistics

- **Node.js 18.x** - JavaScript runtime

- **Express 4.x** - Web application framework### Invoice Management

- **CORS** - Cross-origin resource sharing middleware- `GET /api/invoice` - Get invoices (with filtering & pagination)

- **dotenv** - Environment variable management- `POST /api/invoice` - Create invoice

- `GET /api/invoice/:id` - Get invoice by ID

### Database & ORM- `PUT /api/invoice/:id` - Update invoice

- **PostgreSQL 14+** - Relational database- `DELETE /api/invoice/:id` - Delete invoice

- **Prisma 6.17.1** - Next-generation ORM- `GET /api/invoice/stats/overview` - Get invoice statistics

  - Type-safe database client

  - Automatic migrations### Settings & Reports

  - Schema management- `GET /api/settings/:companyId` - Get company settings

  - Query builder- `PUT /api/settings/:companyId` - Update company settings

- `GET /api/settings/reports/dashboard` - Get dashboard data

### Authentication- `GET /api/settings/reports/revenue` - Get revenue reports

- **@supabase/supabase-js** - Supabase client SDK- `GET /api/settings/reports/gst` - Get GST reports

- **JWT Tokens** - JSON Web Token validation

- **Bearer Authentication** - Standard token format## Database Schema



### Development Tools### Key Models

- **Nodemon** - Auto-restart on file changes

- **ESLint** - Code linting (optional)- **User** - System users with authentication

- **Prisma Studio** - Database GUI for development- **Company** - Business entities with complete profile

- **Customer** - Customer information with GST details

---- **Item** - Products/services with pricing and tax rates

- **Invoice** - Invoice headers with customer and company info

## 🚀 Getting Started- **InvoiceItem** - Invoice line items with calculations

- **Settings** - Company-specific settings and preferences

### Prerequisites

## Development Scripts

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)

- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)```bash

- **npm** or **yarn** - Package manager# Start development server with auto-restart

- **Supabase account** - [Sign up](https://supabase.com/)npm run dev



### Installation# Generate Prisma client after schema changes

npm run db:generate

1. **Clone the repository**

   ```bash# Push schema changes to database

   git clone https://github.com/rupeshv2121/invoice_generator_server.gitnpm run db:push

   cd invoice_generator_server

   ```# Run database migrations

npm run db:migrate

2. **Install dependencies**

   ```bash# Open Prisma Studio (database GUI)

   npm installnpm run db:studio

   ``````



3. **Install Prisma dependencies**## Example API Usage

   ```bash

   cd prisma### Register and Login

   npm install```javascript

   cd ..// Register

   ```const response = await fetch('/api/auth/register', {

    method: 'POST',

4. **Configure environment variables**    headers: { 'Content-Type': 'application/json' },

       body: JSON.stringify({

   Create a `.env` file in the root directory:        email: 'user@example.com',

   ```env        password: 'password123',

   # Database Connection        name: 'John Doe'

   DATABASE_URL="postgresql://username:password@localhost:5432/invoice_db?schema=public"    })

});

   # Server Configuration

   PORT=3001// Login

   NODE_ENV=developmentconst loginResponse = await fetch('/api/auth/login', {

    method: 'POST',

   # Supabase Configuration    headers: { 'Content-Type': 'application/json' },

   SUPABASE_URL=your_supabase_project_url    body: JSON.stringify({

   SUPABASE_ANON_KEY=your_supabase_anon_key        email: 'user@example.com',

   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key        password: 'password123'

    })

   # Frontend URL (for CORS)});

   FRONTEND_URL=http://localhost:5173const { token } = await loginResponse.json();

```

   # JWT Secret (optional, if using custom JWT)

   JWT_SECRET=your_jwt_secret_here### Create Invoice

   ``````javascript

const invoice = await fetch('/api/invoice', {

5. **Setup PostgreSQL Database**    method: 'POST',

    headers: {

   **Option A: Using Local PostgreSQL**        'Content-Type': 'application/json',

   ```bash        'Authorization': `Bearer ${token}`

   # Create database    },

   createdb invoice_db    body: JSON.stringify({

        companyId: 1,

   # Or using psql        customerId: 1,

   psql -U postgres        invoiceDate: '2025-01-01',

   CREATE DATABASE invoice_db;        invoiceItems: [

   \q            {

   ```                description: 'Product 1',

                quantity: 2,

   **Option B: Using Docker**                rate: 100.00,

   ```bash                hsnCode: '12345'

   docker run --name invoice-postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=invoice_db -p 5432:5432 -d postgres:14            }

   ```        ]

    })

6. **Run Prisma Migrations**});

   ```bash```

   npx prisma migrate dev --name init

   ```## Error Handling



   This will:The API uses consistent error responses:

   - Create all database tables

   - Generate Prisma Client```json

   - Apply the schema to your database{

    "error": "Error type",

7. **Generate Prisma Client**    "message": "Human readable message",

   ```bash    "details": ["Validation errors if any"]

   npx prisma generate}

   ``````



8. **Seed Database (Optional)**## Security Features

   ```bash

   # Create seed data for testing- JWT token authentication

   npx prisma db seed- Password hashing with bcrypt

   ```- Input validation with Zod

- SQL injection prevention with Prisma

9. **Start the server**- CORS configuration

- Environment variable protection

   **Development mode (with auto-restart):**

   ```bash## Production Deployment

   npm run dev

   ```1. Set `NODE_ENV=production` in environment

2. Use strong JWT secret

   **Production mode:**3. Configure proper CORS origins

   ```bash4. Set up database backup

   npm start5. Use process manager (PM2)

   ```6. Configure reverse proxy (Nginx)



10. **Verify server is running**## Contributing

    ```

    Server running on http://localhost:30011. Follow existing code structure

    ```2. Add validation for new endpoints

3. Include proper error handling

### Quick Testing4. Update this README for new features

Test the API with cURL or Postman:

```bash
# Health check (no auth required)
curl http://localhost:3001/health

# Get subscription (requires auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/subscription/current
```

---

## 🗄️ Database Schema

### Prisma Schema Overview

The database uses Prisma ORM with PostgreSQL. Here's the complete schema:

```prisma
// User Model (managed by Supabase Auth)
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  // Relations
  companies     Company[]
  customers     Customer[]
  items         Item[]
  invoices      Invoice[]
  subscription  Subscription?
  payments      Payment[]
}

// Company Profile
model Company {
  id              String    @id @default(uuid())
  userId          String
  companyName     String
  phone           String?
  email           String?
  website         String?
  address         String?
  city            String?
  state           String?
  pincode         String?
  country         String?
  gstin           String?   @unique
  pan             String?
  arn             String?
  iec             String?
  bankName        String?
  accountNumber   String?
  ifscCode        String?
  branch          String?
  logoUrl         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices        Invoice[]
  
  @@index([userId])
}

// Customer Model
model Customer {
  id              String    @id @default(uuid())
  userId          String
  customerName    String
  companyName     String?
  phone           String?
  email           String?
  address         String?
  city            String?
  state           String?
  pincode         String?
  country         String?
  gstin           String?
  pan             String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices        Invoice[]
  
  @@index([userId])
}

// Item/Product Model
model Item {
  id              String        @id @default(uuid())
  userId          String
  itemName        String
  description     String?
  hsnCode         String?
  rate            Float
  taxRate         Float         @default(18.0)
  unit            String        @default("nos")
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoiceItems    InvoiceItem[]
  
  @@index([userId])
}

// Invoice Model
model Invoice {
  id              String        @id @default(uuid())
  userId          String
  companyId       String
  customerId      String
  invoiceNumber   String
  invoiceDate     DateTime
  dueDate         DateTime?
  placeOfSupply   String?
  status          InvoiceStatus @default(DRAFT)
  subtotal        Float
  cgst            Float         @default(0)
  sgst            Float         @default(0)
  igst            Float         @default(0)
  totalTax        Float
  grandTotal      Float
  notes           String?
  terms           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  company         Company       @relation(fields: [companyId], references: [id])
  customer        Customer      @relation(fields: [customerId], references: [id])
  items           InvoiceItem[]
  
  @@unique([userId, invoiceNumber])
  @@index([userId])
  @@index([status])
}

// Invoice Line Items
model InvoiceItem {
  id              String    @id @default(uuid())
  invoiceId       String
  itemId          String?
  description     String
  hsnCode         String?
  quantity        Float
  unit            String
  rate            Float
  amount          Float
  taxRate         Float
  taxAmount       Float
  totalAmount     Float
  
  invoice         Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  item            Item?     @relation(fields: [itemId], references: [id])
  
  @@index([invoiceId])
}

// Subscription Model
model Subscription {
  id              String             @id @default(uuid())
  userId          String             @unique
  plan            SubscriptionPlan   @default(FREE)
  status          SubscriptionStatus @default(TRIAL)
  startDate       DateTime           @default(now())
  endDate         DateTime?
  trialEndsAt     DateTime?
  invoicesUsed    Int                @default(0)
  invoicesLimit   Int
  customersLimit  Int
  itemsLimit      Int
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}

// Payment Model (for subscription payments)
model Payment {
  id              String        @id @default(uuid())
  userId          String
  amount          Float
  currency        String        @default("INR")
  status          PaymentStatus @default(PENDING)
  paymentMethod   String?
  transactionId   String?       @unique
  razorpayOrderId String?
  razorpayPaymentId String?
  razorpaySignature String?
  metadata        Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}

// Enums
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum SubscriptionPlan {
  FREE
  BASIC
  PROFESSIONAL
  ENTERPRISE
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  EXPIRED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}
```

### Entity Relationships

```
User (1) ─── (many) Company
User (1) ─── (many) Customer
User (1) ─── (many) Item
User (1) ─── (many) Invoice
User (1) ─── (1) Subscription
User (1) ─── (many) Payment

Company (1) ─── (many) Invoice
Customer (1) ─── (many) Invoice

Invoice (1) ─── (many) InvoiceItem
Item (1) ─── (many) InvoiceItem (optional)
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply pending migrations
npx prisma migrate deploy

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Generate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Authentication Endpoints

#### Verify Token
```http
GET /api/auth/verify
```
**Purpose**: Verify if the provided JWT token is valid  
**Auth**: Required  
**Response**:
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

### 💳 Subscription Endpoints

#### Get Current Subscription
```http
GET /api/subscription/current
```
**Purpose**: Get the logged-in user's subscription details  
**Auth**: Required  
**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "plan": "BASIC",
  "status": "ACTIVE",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-02-01T00:00:00.000Z",
  "invoicesUsed": 25,
  "invoicesLimit": 100,
  "customersLimit": 200,
  "itemsLimit": 500
}
```

#### Get All Plans
```http
GET /api/subscription/plans
```
**Purpose**: Get all available subscription plans with features  
**Auth**: Not required  
**Response**:
```json
[
  {
    "name": "FREE",
    "price": 0,
    "currency": "INR",
    "duration": "7 days",
    "invoicesLimit": 10,
    "customersLimit": 50,
    "itemsLimit": 100,
    "features": ["GST Compliance", "PDF Exports"]
  },
  {
    "name": "BASIC",
    "price": 499,
    "currency": "INR",
    "duration": "monthly",
    "invoicesLimit": 100,
    "customersLimit": 200,
    "itemsLimit": 500,
    "features": ["All FREE features", "Email Support"]
  }
]
```

#### Create Trial Subscription
```http
POST /api/subscription/trial
```
**Purpose**: Create a 7-day trial subscription for a new user  
**Auth**: Required  
**Request Body**: None  
**Response**:
```json
{
  "message": "Trial subscription created successfully",
  "subscription": {
    "id": "uuid",
    "plan": "FREE",
    "status": "TRIAL",
    "trialEndsAt": "2024-01-08T00:00:00.000Z",
    "invoicesLimit": 10
  }
}
```

#### Check Subscription Status
```http
GET /api/subscription/status
```
**Purpose**: Check if user has an active subscription  
**Auth**: Required  
**Response**:
```json
{
  "hasActiveSubscription": true,
  "daysRemaining": 25,
  "isTrialActive": false,
  "isExpiringSoon": false
}
```

---

### 🏢 Company Endpoints

#### Get User's Company Profile
```http
GET /api/my-company
```
**Auth**: Required  
**Response**:
```json
{
  "id": "uuid",
  "companyName": "ABC Pvt Ltd",
  "phone": "+91 9876543210",
  "email": "abc@example.com",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "bankName": "HDFC Bank",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234"
}
```

#### Create/Update Company Profile
```http
POST /api/my-company
PUT /api/my-company/:id
```
**Auth**: Required  
**Request Body**:
```json
{
  "companyName": "ABC Pvt Ltd",
  "phone": "+91 9876543210",
  "email": "abc@example.com",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "bankName": "HDFC Bank",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234"
}
```

---

### 👥 Customer Endpoints

#### Get All Customers
```http
GET /api/customers
```
**Auth**: Required  
**Query Params**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by name/company/GSTIN

**Response**:
```json
{
  "customers": [
    {
      "id": "uuid",
      "customerName": "John Doe",
      "companyName": "XYZ Corp",
      "phone": "+91 9876543210",
      "email": "john@xyzcorp.com",
      "gstin": "27XYZAB1234C1Z5",
      "state": "Karnataka"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 3
}
```

#### Create Customer
```http
POST /api/customers
```
**Auth**: Required + Subscription Limit Check  
**Request Body**:
```json
{
  "customerName": "John Doe",
  "companyName": "XYZ Corp",
  "phone": "+91 9876543210",
  "email": "john@xyzcorp.com",
  "address": "456 Park Ave",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "gstin": "27XYZAB1234C1Z5"
}
```

#### Update Customer
```http
PUT /api/customers/:id
```
**Auth**: Required  
**Request Body**: Same as create

#### Delete Customer
```http
DELETE /api/customers/:id
```
**Auth**: Required  
**Response**:
```json
{
  "message": "Customer deleted successfully"
}
```

---

### 📦 Item Endpoints

#### Get All Items
```http
GET /api/items
```
**Auth**: Required  
**Response**:
```json
[
  {
    "id": "uuid",
    "itemName": "Web Development Service",
    "description": "Full-stack web development",
    "hsnCode": "998314",
    "rate": 50000,
    "taxRate": 18,
    "unit": "hours"
  }
]
```

#### Create Item
```http
POST /api/items
```
**Auth**: Required + Subscription Limit Check  
**Request Body**:
```json
{
  "itemName": "Web Development Service",
  "description": "Full-stack web development",
  "hsnCode": "998314",
  "rate": 50000,
  "taxRate": 18,
  "unit": "hours"
}
```

#### Update Item
```http
PUT /api/items/:id
```
**Auth**: Required

#### Delete Item
```http
DELETE /api/items/:id
```
**Auth**: Required

---

### 📄 Invoice Endpoints

#### Get All Invoices
```http
GET /api/invoices
```
**Auth**: Required  
**Query Params**:
- `page`, `limit`, `search`
- `status`: Filter by status (DRAFT, SENT, PAID, OVERDUE)
- `startDate`, `endDate`: Date range filter

**Response**:
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-001",
      "invoiceDate": "2024-01-15",
      "dueDate": "2024-02-15",
      "status": "PAID",
      "customer": {
        "customerName": "John Doe",
        "companyName": "XYZ Corp"
      },
      "subtotal": 50000,
      "totalTax": 9000,
      "grandTotal": 59000
    }
  ],
  "total": 250,
  "page": 1
}
```

#### Create Invoice
```http
POST /api/invoices
```
**Auth**: Required + Subscription Limit Check  
**Request Body**:
```json
{
  "companyId": "uuid",
  "customerId": "uuid",
  "invoiceNumber": "INV-001",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "placeOfSupply": "Maharashtra",
  "items": [
    {
      "itemId": "uuid",
      "description": "Web Development",
      "hsnCode": "998314",
      "quantity": 100,
      "unit": "hours",
      "rate": 500,
      "taxRate": 18
    }
  ],
  "notes": "Thank you for your business",
  "terms": "Payment due within 30 days"
}
```

**Backend Auto-calculations**:
- `amount = quantity × rate`
- `taxAmount = amount × (taxRate / 100)`
- If same state: `cgst = taxAmount / 2`, `sgst = taxAmount / 2`
- If different state: `igst = taxAmount`
- `subtotal = sum of all amounts`
- `totalTax = sum of all taxAmounts`
- `grandTotal = subtotal + totalTax`

#### Get Invoice by ID
```http
GET /api/invoices/:id
```
**Auth**: Required

#### Update Invoice
```http
PUT /api/invoices/:id
```
**Auth**: Required

#### Delete Invoice
```http
DELETE /api/invoices/:id
```
**Auth**: Required

---

### 📊 Dashboard Endpoints

#### Get Dashboard Metrics
```http
GET /api/dashboard/metrics
```
**Auth**: Required  
**Response**:
```json
{
  "totalRevenue": 2500000,
  "totalInvoices": 250,
  "activeCustomers": 75,
  "pendingPayments": 350000,
  "monthlyRevenue": [
    { "month": "Jan", "revenue": 200000 },
    { "month": "Feb", "revenue": 250000 }
  ],
  "gstSummary": {
    "cgst": 45000,
    "sgst": 45000,
    "igst": 20000,
    "total": 110000
  }
}
```

---

## 🛡️ Middleware

### 1. Authentication Middleware (`authMiddleware.js`)

**Purpose**: Validate Supabase JWT token and extract user

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user; // Attach user to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

**Usage**:
```javascript
app.get('/api/protected-route', authMiddleware, (req, res) => {
  // req.user is available here
});
```

---

### 2. Subscription Middleware (`subscriptionMiddleware.js`)

#### `requireActiveSubscription`

**Purpose**: Block access if user doesn't have active subscription

```javascript
const requireActiveSubscription = async (req, res, next) => {
  const subscription = await subscriptionService.getSubscription(req.user.id);
  
  if (!subscription || !subscriptionService.hasActiveSubscription(subscription)) {
    return res.status(403).json({
      error: 'Active subscription required',
      message: 'Please upgrade your plan to continue'
    });
  }
  
  next();
};
```

#### `checkInvoiceLimit`

**Purpose**: Block invoice creation if limit exceeded

```javascript
const checkInvoiceLimit = async (req, res, next) => {
  const subscription = await subscriptionService.getSubscription(req.user.id);
  
  if (!subscriptionService.canCreateInvoice(subscription)) {
    return res.status(403).json({
      error: 'Invoice limit reached',
      message: `You've used ${subscription.invoicesUsed} of ${subscription.invoicesLimit} invoices. Upgrade to continue.`
    });
  }
  
  next();
};
```

**Usage**:
```javascript
router.post('/invoices', 
  authMiddleware, 
  requireActiveSubscription, 
  checkInvoiceLimit, 
  createInvoice
);
```

---

### 3. CORS Middleware

**Purpose**: Allow cross-origin requests from frontend

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🔧 Services

### 1. Subscription Service (`subscriptionService.js`)

**Core Business Logic for Subscription Management**

#### Methods:

##### `getSubscription(userId)`
Returns subscription for a user
```javascript
const subscription = await subscriptionService.getSubscription(userId);
```

##### `hasActiveSubscription(subscription)`
Checks if subscription is active and not expired
```javascript
const isActive = subscriptionService.hasActiveSubscription(subscription);
// Returns: true/false
```

##### `createTrialSubscription(userId)`
Creates 7-day trial with FREE plan
```javascript
const trial = await subscriptionService.createTrialSubscription(userId);
// Sets trialEndsAt = now + 7 days
// Sets invoicesLimit = 10, customersLimit = 50, itemsLimit = 100
```

##### `canCreateInvoice(subscription)`
Checks if user can create more invoices
```javascript
const canCreate = subscriptionService.canCreateInvoice(subscription);
// Returns: subscription.invoicesUsed < subscription.invoicesLimit
```

##### `incrementInvoiceUsage(userId)`
Increments invoice counter after successful creation
```javascript
await subscriptionService.incrementInvoiceUsage(userId);
// subscription.invoicesUsed++
```

##### `getPlanDetails(planName)`
Returns features and limits for a plan
```javascript
const planInfo = subscriptionService.getPlanDetails('BASIC');
// Returns: { name, price, invoicesLimit, ... }
```

##### `activateSubscription(userId, plan, paymentId)`
Activates a paid subscription
```javascript
await subscriptionService.activateSubscription(userId, 'PROFESSIONAL', 'pay_123');
// Sets status = ACTIVE, plan = PROFESSIONAL
// Sets endDate = now + 30 days
```

---

### 2. Company Service (`companyService.js`)

**Manage company profiles**

```javascript
// Get company for user
const company = await companyService.getCompanyByUserId(userId);

// Create company
const company = await companyService.createCompany(userId, companyData);

// Update company
const updated = await companyService.updateCompany(companyId, updateData);
```

---

### 3. Customer Service (`customerService.js`)

**CRUD operations for customers**

```javascript
// Get all customers for user
const customers = await customerService.getCustomersByUserId(userId);

// Create customer (with limit check)
const customer = await customerService.createCustomer(userId, customerData);

// Search customers
const results = await customerService.searchCustomers(userId, 'john');
```

---

### 4. Invoice Service (`invoiceService.js`)

**Invoice management with GST calculations**

```javascript
// Calculate taxes
const taxes = invoiceService.calculateGST(amount, taxRate, sameState);
// Returns: { cgst, sgst, igst, totalTax }

// Create invoice
const invoice = await invoiceService.createInvoice(userId, invoiceData);
// Auto-calculates all totals and taxes

// Get invoices with filters
const invoices = await invoiceService.getInvoices(userId, { 
  status: 'PAID', 
  startDate: '2024-01-01' 
});
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection String
DATABASE_URL="postgresql://username:password@localhost:5432/invoice_db?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT Secret (if using custom JWT)
JWT_SECRET=your_random_secret_key_here

# Payment Gateway (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Security Notes**:
- Never commit `.env` file to Git
- Use different keys for dev/staging/production
- Rotate secrets regularly
- Use service role key only on backend (never expose to frontend)

---

## 📜 Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-restart on changes)
npm start                # Start in production mode

# Database
npx prisma migrate dev   # Create and apply migration
npx prisma migrate reset # Reset database (deletes all data)
npx prisma migrate deploy # Apply pending migrations (production)
npx prisma generate      # Generate Prisma Client
npx prisma studio        # Open database GUI on http://localhost:5555

# Database Seeding (future)
npm run seed             # Populate database with test data

# Testing (future)
npm test                 # Run unit tests with Jest
npm run test:e2e         # Run integration tests

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

---

## 🚀 Deployment

### Option 1: Render.com (Recommended)

1. **Create PostgreSQL Database**:
   - Go to Render Dashboard
   - Create new PostgreSQL database
   - Copy connection string

2. **Create Web Service**:
   - Connect GitHub repository
   - Select `invoice_generator_server` directory
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`

3. **Add Environment Variables**:
   ```
   DATABASE_URL=<render_postgres_connection_string>
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_ANON_KEY=<your_anon_key>
   FRONTEND_URL=<your_frontend_domain>
   ```

4. **Deploy**: Click "Create Web Service"

---

### Option 2: Railway.app

1. **Create Project**: Click "New Project" → "Deploy from GitHub"
2. **Add PostgreSQL Plugin**: Click "New" → "Database" → "PostgreSQL"
3. **Configure Variables**: Add all environment variables
4. **Deploy**: Automatic deployment on push

---

### Option 3: Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create invoice-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SUPABASE_URL=your_url
heroku config:set FRONTEND_URL=your_frontend

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

---

### Option 4: VPS (Ubuntu)

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Clone repository
git clone https://github.com/rupeshv2121/invoice_generator_server.git
cd invoice_generator_server

# Install dependencies
npm install

# Setup environment
nano .env
# Paste all environment variables

# Run migrations
npx prisma migrate deploy

# Install PM2 (process manager)
sudo npm install -g pm2

# Start server
pm2 start npm --name "invoice-api" -- start

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/invoice-api
# Configure proxy to localhost:3001

# Enable SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🔒 Security Best Practices

- ✅ **Never expose service role key**: Use only on backend
- ✅ **Validate all inputs**: Use Joi/Zod for request validation
- ✅ **Sanitize data**: Prevent SQL injection (Prisma handles this)
- ✅ **Rate limiting**: Add express-rate-limit middleware
- ✅ **Helmet.js**: Add security headers
- ✅ **HTTPS only**: Force SSL in production
- ✅ **CORS whitelist**: Only allow specific origins
- ✅ **Log monitoring**: Use Winston or Morgan for logging
- ✅ **Error handling**: Never expose stack traces in production

---

## 📞 Support & Contact

- 📧 **Email**: rupeshvarshney7@gmail.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/rupeshv2121/invoice_generator_server/issues)
- 📖 **Documentation**: See this README

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

<div align="center">

**Built with ❤️ by [Rupesh Varshney](https://github.com/rupeshv2121)**

</div>
