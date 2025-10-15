import express from 'express';
import { validateCustomer, validateCustomerUpdate } from '../dto/customerDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();
// Get all customers with search and pagination
router.get('/', async (req, res, next) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10,
            companyId
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {
            isActive: true,
            company: {
                userId: req.user.id
            }
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { gstin: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    company: {
                        select: { id: true, companyName: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.customer.count({ where })
        ]);

        res.json({
            customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get customer by ID
router.get('/:id', async (req, res, next) => {
    try {
        const customer = await prisma.customer.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            },
            include: {
                company: {
                    select: { id: true, companyName: true }
                },
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        invoiceDate: true,
                        totalAmount: true,
                        status: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

// Create new customer
router.post('/', async (req, res, next) => {
    try {
        const validation = validateCustomer(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Verify company belongs to user
        const company = await prisma.company.findFirst({
            where: {
                id: validation.data.companyId,
                userId: req.user.id
            }
        });

        if (!company) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const customer = await prisma.customer.create({
            data: validation.data,
            include: {
                company: {
                    select: { id: true, companyName: true }
                }
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
});

// Update customer
router.patch('/:id', async (req, res, next) => {
    try {
        const validation = validateCustomerUpdate(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Check if customer exists and belongs to user's company
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const customer = await prisma.customer.update({
            where: { id: parseInt(req.params.id) },
            data: validation.data,
            include: {
                company: {
                    select: { id: true, companyName: true }
                }
            }
        });

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

// Soft delete customer
router.delete('/:id', async (req, res, next) => {
    try {
        // Check if customer exists and belongs to user's company
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await prisma.customer.update({
            where: { id: parseInt(req.params.id) },
            data: { isActive: false }
        });

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get customer statistics
router.get('/stats/overview', async (req, res, next) => {
    try {
        const { companyId } = req.query;

        const where = {
            isActive: true,
            company: {
                userId: req.user.id
            }
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        }

        const [
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices
        ] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),
            prisma.customer.count({
                where: {
                    ...where,
                    invoices: {
                        some: {}
                    }
                }
            })
        ]);

        res.json({
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices,
            customersWithoutInvoices: totalCustomers - customersWithInvoices
        });
    } catch (error) {
        next(error);
    }
});

export default router;