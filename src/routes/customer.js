import express from 'express';
import { validateCustomer, validateCustomerUpdate } from '../dto/customerDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();
// Get all customers with search and pagination

// Get customer statistics
router.get('/stats', async (req, res, next) => {
    try {
        // Get user's company profile
        const userCompany = await prisma.companyProfile.findFirst({
            where: { userId: req.user.id },
            select: { id: true }
        });

        if (!userCompany) {
            return res.status(404).json({ error: 'Company profile not found. Please create a company profile first.' });
        }

        const where = {
            isActive: true,
            companyProfileId: userCompany.id
        };

        const [
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices,
            gstRegisteredCount
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
            prisma.customer.count({
                where: {
                    ...where,
                    gstin: {
                        not: null,
                        not: ''
                    }
                }
            })
        ]);

        res.json({
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices,
            customersWithoutInvoices: totalCustomers - customersWithInvoices,
            gstRegisteredCount
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
        console.log("=== CREATE CUSTOMER REQUEST ===");
        console.log("User ID:", req.user.id);
        console.log("Request Body:", req.body);

        const validation = validateCustomer(req.body);
        if (!validation.success) {
            console.log("Validation failed:", validation.error.errors);
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const customerData = validation.data;
        console.log("Validated customer data:", customerData);

        // Get user's company profile - now required
        const userCompany = await prisma.companyProfile.findFirst({
            where: { userId: req.user.id },
            select: { id: true, companyName: true }
        });

        console.log("User company:", userCompany);

        if (!userCompany) {
            console.log("Company profile not found for user:", req.user.id);
            return res.status(404).json({ error: 'Company profile not found. Please create a company profile first.' });
        }

        // Check if customer with same company name already exists for this company
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                companyName: customerData.companyName.trim(),
                companyProfileId: userCompany.id,
                isActive: true
            }
        });

        if (existingCustomer) {
            console.log("Duplicate customer found:", existingCustomer);
            return res.status(400).json({
                success: false,
                error: `Customer with company name "${customerData.companyName}" already exists. Please use a different name.`
            });
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

        console.log("Customer created successfully:", customer);
        console.log("=== END CREATE CUSTOMER ===");

        res.status(201).json(customer);
    } catch (error) {
        console.error("=== CREATE CUSTOMER ERROR ===");
        console.error("Error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
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

        // If company name is being updated, check for duplicates
        if (validation.data.companyName && validation.data.companyName !== existingCustomer.companyName) {
            const duplicateCustomer = await prisma.customer.findFirst({
                where: {
                    companyName: validation.data.companyName.trim(),
                    companyProfileId: existingCustomer.companyProfileId,
                    isActive: true,
                    NOT: {
                        id: req.params.id
                    }
                }
            });

            if (duplicateCustomer) {
                return res.status(400).json({
                    success: false,
                    error: `Customer with company name "${validation.data.companyName}" already exists. Please use a different name.`
                });
            }
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