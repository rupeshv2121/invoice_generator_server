# Invoice Generator Server

A comprehensive backend API for managing invoices, customers, items, and company profiles.

## Features

- 🔐 JWT-based authentication
- 🏢 Multi-company support
- 👥 Customer management with search
- 📦 Items/Products management
- 🧾 Invoice creation with automatic calculations
- 📊 Dashboard and reporting APIs
- 🔍 Advanced search and filtering
- 📈 Revenue and GST reports

## Technology Stack

- **Node.js** with ES Modules
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **MySQL** - Database
- **JWT** - Authentication
- **Zod** - Input validation
- **bcrypt** - Password hashing

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd invoice_generator_server
npm install
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="mysql://username:password@localhost:3306/invoice_generator"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate
```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Company Management
- `GET /api/company` - Get all companies
- `POST /api/company` - Create company
- `GET /api/company/:id` - Get company by ID
- `PUT /api/company/:id` - Update company
- `DELETE /api/company/:id` - Delete company
- `GET /api/company/profile/main` - Get main company profile

### Customer Management
- `GET /api/customer` - Get customers (with search & pagination)
- `POST /api/customer` - Create customer
- `GET /api/customer/:id` - Get customer by ID
- `PUT /api/customer/:id` - Update customer
- `DELETE /api/customer/:id` - Delete customer
- `GET /api/customer/stats/overview` - Get customer statistics

### Items Management
- `GET /api/item` - Get items (with search & pagination)
- `POST /api/item` - Create item
- `GET /api/item/:id` - Get item by ID
- `PUT /api/item/:id` - Update item
- `DELETE /api/item/:id` - Delete item
- `GET /api/item/search/autocomplete` - Search items for autocomplete
- `GET /api/item/stats/overview` - Get item statistics

### Invoice Management
- `GET /api/invoice` - Get invoices (with filtering & pagination)
- `POST /api/invoice` - Create invoice
- `GET /api/invoice/:id` - Get invoice by ID
- `PUT /api/invoice/:id` - Update invoice
- `DELETE /api/invoice/:id` - Delete invoice
- `GET /api/invoice/stats/overview` - Get invoice statistics

### Settings & Reports
- `GET /api/settings/:companyId` - Get company settings
- `PUT /api/settings/:companyId` - Update company settings
- `GET /api/settings/reports/dashboard` - Get dashboard data
- `GET /api/settings/reports/revenue` - Get revenue reports
- `GET /api/settings/reports/gst` - Get GST reports

## Database Schema

### Key Models

- **User** - System users with authentication
- **Company** - Business entities with complete profile
- **Customer** - Customer information with GST details
- **Item** - Products/services with pricing and tax rates
- **Invoice** - Invoice headers with customer and company info
- **InvoiceItem** - Invoice line items with calculations
- **Settings** - Company-specific settings and preferences

## Development Scripts

```bash
# Start development server with auto-restart
npm run dev

# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Example API Usage

### Register and Login
```javascript
// Register
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe'
    })
});

// Login
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
    })
});
const { token } = await loginResponse.json();
```

### Create Invoice
```javascript
const invoice = await fetch('/api/invoice', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        companyId: 1,
        customerId: 1,
        invoiceDate: '2025-01-01',
        invoiceItems: [
            {
                description: 'Product 1',
                quantity: 2,
                rate: 100.00,
                hsnCode: '12345'
            }
        ]
    })
});
```

## Error Handling

The API uses consistent error responses:

```json
{
    "error": "Error type",
    "message": "Human readable message",
    "details": ["Validation errors if any"]
}
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection prevention with Prisma
- CORS configuration
- Environment variable protection

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use strong JWT secret
3. Configure proper CORS origins
4. Set up database backup
5. Use process manager (PM2)
6. Configure reverse proxy (Nginx)

## Contributing

1. Follow existing code structure
2. Add validation for new endpoints
3. Include proper error handling
4. Update this README for new features