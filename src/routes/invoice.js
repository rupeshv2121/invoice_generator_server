import express from 'express';
import { validateInvoice, validateInvoiceUpdate } from '../dto/invoiceDto.js';
import { generateInvoiceNumber } from '../utils/invoiceUtils.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

// Get all invoices with filtering and pagination
router.get('/', async (req, res, next) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10,
            status = '',
            customerId,
            startDate,
            endDate
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
            companyProfileId: userCompany.id
        };

        if (customerId) {
            where.customerId = customerId;
        }

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.invoiceDate = {};
            if (startDate) where.invoiceDate.gte = new Date(startDate);
            if (endDate) where.invoiceDate.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { marka: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    company: {
                        select: { id: true, companyName: true }
                    },
                    customer: {
                        select: { id: true, name: true, gstin: true }
                    },
                    invoiceItems: {
                        select: {
                            id: true,
                            description: true,
                            quantity: true,
                            rate: true,
                            totalAmount: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({
            invoices,
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

// Get invoice by ID
router.get('/:id', async (req, res, next) => {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            },
            include: {
                company: true,
                customer: true,
                invoiceItems: {
                    include: {
                        item: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        next(error);
    }
});

// Create new invoice
router.post('/', async (req, res, next) => {
    try {
        const validation = validateInvoice(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const { invoiceItems, ...invoiceData } = validation.data;

        // Verify company and customer belong to user

        // Customer validation commented out for testing without customer lookup
        // const [company, customer] = await Promise.all([
        //     prisma.companyProfile.findFirst({
        //         where: {
        //             id: invoiceData.companyId,
        //             userId: req.user.id
        //         }
        //     }),
        //     prisma.customer.findFirst({
        //         where: {
        //             id: invoiceData.customerId,
        //         }
        //     })
        // ]);

        // if (!company) {
        //     return res.status(400).json({ error: 'Invalid company ID' });
        // }

        // if (!customer) {
        //     return res.status(400).json({ error: 'Invalid customer ID' });
        // }

        // Generate invoice number if not provided
        if (!invoiceData.invoiceNumber) {
            invoiceData.invoiceNumber = await generateInvoiceNumber(invoiceData.companyProfileId);
        }

        // Calculate totals
        let subtotal = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        const processedItems = invoiceItems.map(item => {
            const amount = item.quantity * item.rate;
            const cgst = (amount * item.cgstRate) / 100;
            const sgst = (amount * item.sgstRate) / 100;
            const igst = (amount * item.igstRate) / 100;
            const total = amount + cgst + sgst + igst;

            subtotal += amount;
            cgstAmount += cgst;
            sgstAmount += sgst;
            igstAmount += igst;

            return {
                ...item,
                amount,
                cgstAmount: cgst,
                sgstAmount: sgst,
                igstAmount: igst,
                totalAmount: total
            };
        });

        const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

        // Create invoice with items in a transaction
        const invoice = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    ...invoiceData,
                    userId: req.user.id,
                    subtotal,
                    cgstAmount,
                    sgstAmount,
                    igstAmount,
                    totalAmount
                }
            });

            await tx.invoiceItem.createMany({
                data: processedItems.map(item => ({
                    ...item,
                    invoiceId: newInvoice.id
                }))
            });

            return tx.invoice.findUnique({
                where: { id: newInvoice.id },
                include: {
                    company: true,
                    customer: true,
                    invoiceItems: true
                }
            });
        });

        res.status(201).json(invoice);
    } catch (error) {
        next(error);
    }
});

// Update invoice
router.put('/:id', async (req, res, next) => {
    try {
        const validation = validateInvoiceUpdate(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Check if invoice exists and belongs to user
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            }
        });

        if (!existingInvoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const { invoiceItems, ...invoiceData } = validation.data;

        let updatedInvoice;

        if (invoiceItems) {
            // If items are being updated, recalculate totals
            let subtotal = 0;
            let cgstAmount = 0;
            let sgstAmount = 0;
            let igstAmount = 0;

            const processedItems = invoiceItems.map(item => {
                const amount = item.quantity * item.rate;
                const cgst = (amount * item.cgstRate) / 100;
                const sgst = (amount * item.sgstRate) / 100;
                const igst = (amount * item.igstRate) / 100;
                const total = amount + cgst + sgst + igst;

                subtotal += amount;
                cgstAmount += cgst;
                sgstAmount += sgst;
                igstAmount += igst;

                return {
                    ...item,
                    amount,
                    cgstAmount: cgst,
                    sgstAmount: sgst,
                    igstAmount: igst,
                    totalAmount: total
                };
            });

            const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

            // Update invoice with items in a transaction
            updatedInvoice = await prisma.$transaction(async (tx) => {
                // Delete existing items
                await tx.invoiceItem.deleteMany({
                    where: { invoiceId: parseInt(req.params.id) }
                });

                // Update invoice
                const invoice = await tx.invoice.update({
                    where: { id: parseInt(req.params.id) },
                    data: {
                        ...invoiceData,
                        subtotal,
                        cgstAmount,
                        sgstAmount,
                        igstAmount,
                        totalAmount
                    }
                });

                // Create new items
                await tx.invoiceItem.createMany({
                    data: processedItems.map(item => ({
                        ...item,
                        invoiceId: invoice.id
                    }))
                });

                return tx.invoice.findUnique({
                    where: { id: invoice.id },
                    include: {
                        company: true,
                        customer: true,
                        invoiceItems: true
                    }
                });
            });
        } else {
            // Just update invoice data without items
            updatedInvoice = await prisma.invoice.update({
                where: { id: parseInt(req.params.id) },
                data: invoiceData,
                include: {
                    company: true,
                    customer: true,
                    invoiceItems: true
                }
            });
        }

        res.json(updatedInvoice);
    } catch (error) {
        next(error);
    }
});

// Delete invoice
router.delete('/:id', async (req, res, next) => {
    try {
        // Check if invoice exists and belongs to user
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            }
        });

        if (!existingInvoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Delete invoice and items (cascade delete will handle items)
        await prisma.invoice.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get invoice statistics
router.get('/stats', async (req, res, next) => {
    try {
        const { companyId } = req.query;

        const where = {
            company: {
                userId: req.user.id
            }
        };

        if (companyId) {
            where.companyProfileId = parseInt(companyId);
        }

        const [
            totalInvoices,
            totalRevenue,
            paidInvoices,
            pendingInvoices,
            overdueInvoices
        ] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.aggregate({
                where,
                _sum: { totalAmount: true }
            }),
            prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
            prisma.invoice.count({ where: { ...where, status: 'SENT' } }),
            prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } })
        ]);

        res.json({
            totalInvoices,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            paidInvoices,
            pendingInvoices,
            overdueInvoices,
            draftInvoices: totalInvoices - paidInvoices - pendingInvoices - overdueInvoices
        });
    } catch (error) {
        next(error);
    }
});

export default router;