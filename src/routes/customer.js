import express from 'express';
import { validateCustomer, validateCustomerUpdate } from '../dto/customerDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();
// Get all customers with search and pagination

// Get customer statistics
router.get('/stats', async (req, res, next) => {
    try {
        const where = { isActive: true };

        const [
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices,
            gstRegisteredCount,
            outstandingAmountData
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
            }),
            // prisma.customer.count({
            //     where: {
            //         ...where,
            //         gstRegistered: true  // assuming this boolean column exists
            //     }
            // }),
            // prisma.invoice.aggregate({
            //     _sum: {
            //         balanceDue: true  // assuming your invoices table has a balanceDue field
            //     }
            // })
        ]);

        // const outstandingAmount = outstandingAmountData._sum.balanceDue || 0;

        res.json({
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices,
            customersWithoutInvoices: totalCustomers - customersWithInvoices,
            gstRegisteredCount,
            // outstandingAmount
        });
    } catch (error) {
        next(error);
    }
});



router.get('/', async (req, res, next) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get user's company profile
        const userCompany = await prisma.companyProfile.findFirst({
            where: { userId: req.user.id },
            select: { id: true }
        });

        if (!userCompany) {
            return res.status(404).json({ error: 'Company profile not found. Please create a company profile first.' });
        }

        // Build where clause - filter by user's company
        const where = {
            isActive: true,
            companyProfileId: userCompany.id
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { gstin: { contains: search, mode: 'insensitive' } }
            ];
        }

        console.log('Customer query where:', where);

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
        console.log("Incoming Customer Data:", req.body);

        const validation = validateCustomer(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const customerData = validation.data;

        // Get user's company profile - now required
        const userCompany = await prisma.companyProfile.findFirst({
            where: { userId: req.user.id },
            select: { id: true }
        });

        if (!userCompany) {
            return res.status(404).json({ error: 'Company profile not found. Please create a company profile first.' });
        }

        // Create customer
        const customer = await prisma.customer.create({
            data: {
                name: customerData.name,
                companyName: customerData.companyName,
                address: customerData.address,
                city: customerData.city,
                state: customerData.state,
                pincode: customerData.pincode,
                country: customerData.country || 'India',
                phone: customerData.phone,
                email: customerData.email,
                EximCode: customerData.EximCode,
                gstin: customerData.gstin,
                pan: customerData.pan,
                companyProfileId: userCompany.id, // Link to user's company
                isActive: true
            },
            include: {
                company: {
                    select: { id: true, companyName: true }
                }
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error("Create customer error:", error);
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

        // Check if customer exists
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                id: req.params.id,
                isActive: true
            }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const customer = await prisma.customer.update({
            where: { id: req.params.id },
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
        // Check if customer exists
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                id: req.params.id,
                isActive: true
            }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await prisma.customer.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;