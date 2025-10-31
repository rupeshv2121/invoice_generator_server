import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Configure environment variables
dotenv.config();

// Import routes
import companyRoutes from './routes/company.js';
import customerRoutes from './routes/customer.js';
import invoiceRoutes from './routes/invoice.js';
import itemRoutes from './routes/item.js';
import settingsRoutes from './routes/settings.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import Prisma client
import { supabaseAuth } from './middleware/auth.js';
import prisma from './utils/prismaClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Invoice Generator Server is running!' });
});


// app.use('/api/company', supabaseAuth, companyRoutes); // TEMPORARILY DISABLED AUTH FOR TESTING
app.use('/api/company', companyRoutes); // <-- No auth for testing
app.use('/api/customer', supabaseAuth, customerRoutes);
app.use('/api/item', supabaseAuth, itemRoutes);
app.use('/api/invoice', supabaseAuth, invoiceRoutes);
app.use('/api/settings', supabaseAuth, settingsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await prisma.$disconnect();
    process.exit(0);
});

export default app;