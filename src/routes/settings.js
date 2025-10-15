import express from 'express';
import { validateSettings } from '../dto/settingsDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

// Get settings for a company
router.get('/:companyId', async (req, res, next) => {
    try {
        const companyId = parseInt(req.params.companyId);

        // Verify company belongs to user
        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId: req.user.id
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        let settings = await prisma.settings.findUnique({
            where: { companyId }
        });

        if (!settings) {
            // Create default settings
            settings = await prisma.settings.create({
                data: {
                    companyId,
                    invoicePrefix: 'INV',
                    nextInvoiceNumber: 1,
                    defaultCgstRate: 9.00,
                    defaultSgstRate: 9.00,
                    defaultIgstRate: 18.00
                }
            });
        }

        res.json(settings);
    } catch (error) {
        next(error);
    }
});

// Update settings
router.put('/:companyId', async (req, res, next) => {
    try {
        const companyId = parseInt(req.params.companyId);

        const validation = validateSettings(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Verify company belongs to user
        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId: req.user.id
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const settings = await prisma.settings.upsert({
            where: { companyId },
            update: validation.data,
            create: {
                ...validation.data,
                companyId
            }
        });

        res.json(settings);
    } catch (error) {
        next(error);
    }
});

// Get dashboard reports
router.get('/reports/dashboard', async (req, res, next) => {
    try {
        const { companyId } = req.query;

        const where = {
            company: {
                userId: req.user.id
            }
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        }

        // Get current month and year
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalInvoices,
            totalRevenue,
            currentMonthRevenue,
            lastMonthRevenue,
            recentInvoices,
            invoicesByStatus,
            monthlyRevenue
        ] = await Promise.all([
            // Total invoices
            prisma.invoice.count({ where }),

            // Total revenue
            prisma.invoice.aggregate({
                where,
                _sum: { totalAmount: true }
            }),

            // Current month revenue
            prisma.invoice.aggregate({
                where: {
                    ...where,
                    invoiceDate: {
                        gte: currentMonthStart,
                        lte: currentMonthEnd
                    }
                },
                _sum: { totalAmount: true }
            }),

            // Last month revenue
            prisma.invoice.aggregate({
                where: {
                    ...where,
                    invoiceDate: {
                        gte: lastMonthStart,
                        lte: lastMonthEnd
                    }
                },
                _sum: { totalAmount: true }
            }),

            // Recent invoices
            prisma.invoice.findMany({
                where,
                include: {
                    customer: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),

            // Invoices by status
            prisma.invoice.groupBy({
                by: ['status'],
                where,
                _count: true,
                _sum: { totalAmount: true }
            }),

            // Monthly revenue for last 6 months
            Promise.all(
                Array.from({ length: 6 }, (_, i) => {
                    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                    return prisma.invoice.aggregate({
                        where: {
                            ...where,
                            invoiceDate: {
                                gte: monthStart,
                                lte: monthEnd
                            }
                        },
                        _sum: { totalAmount: true }
                    });
                })
            )
        ]);

        // Calculate growth percentage
        const currentRevenue = currentMonthRevenue._sum.totalAmount || 0;
        const lastRevenue = lastMonthRevenue._sum.totalAmount || 0;
        const growthPercentage = lastRevenue > 0
            ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
            : 0;

        // Format monthly revenue data
        const monthlyRevenueData = monthlyRevenue.reverse().map((month, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
            return {
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: month._sum.totalAmount || 0
            };
        });

        res.json({
            overview: {
                totalInvoices,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                currentMonthRevenue: currentRevenue,
                growthPercentage: Math.round(growthPercentage * 100) / 100
            },
            recentInvoices: recentInvoices.map(invoice => ({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customer.name,
                amount: invoice.totalAmount,
                status: invoice.status,
                date: invoice.invoiceDate
            })),
            invoicesByStatus: invoicesByStatus.map(status => ({
                status: status.status,
                count: status._count,
                totalAmount: status._sum.totalAmount || 0
            })),
            monthlyRevenue: monthlyRevenueData
        });
    } catch (error) {
        next(error);
    }
});

// Get revenue reports
router.get('/reports/revenue', async (req, res, next) => {
    try {
        const { companyId, period = 'monthly', year } = req.query;

        const where = {
            company: {
                userId: req.user.id
            }
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        }

        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        let groupBy, dateRange;

        if (period === 'yearly') {
            // Group by year for last 5 years
            groupBy = 'year';
            dateRange = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
        } else {
            // Group by month for current year
            groupBy = 'month';
            dateRange = Array.from({ length: 12 }, (_, i) => i + 1);
        }

        const revenueData = await Promise.all(
            dateRange.map(async (period) => {
                let startDate, endDate;

                if (groupBy === 'year') {
                    startDate = new Date(period, 0, 1);
                    endDate = new Date(period, 11, 31);
                } else {
                    startDate = new Date(currentYear, period - 1, 1);
                    endDate = new Date(currentYear, period, 0);
                }

                const result = await prisma.invoice.aggregate({
                    where: {
                        ...where,
                        invoiceDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    _sum: { totalAmount: true },
                    _count: true
                });

                return {
                    period: groupBy === 'year' ? period : new Date(currentYear, period - 1).toLocaleDateString('en-US', { month: 'short' }),
                    revenue: result._sum.totalAmount || 0,
                    invoiceCount: result._count
                };
            })
        );

        res.json({
            period: groupBy,
            year: currentYear,
            data: revenueData
        });
    } catch (error) {
        next(error);
    }
});

// Get GST reports
router.get('/reports/gst', async (req, res, next) => {
    try {
        const { companyId, startDate, endDate } = req.query;

        const where = {
            company: {
                userId: req.user.id
            }
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        }

        if (startDate || endDate) {
            where.invoiceDate = {};
            if (startDate) where.invoiceDate.gte = new Date(startDate);
            if (endDate) where.invoiceDate.lte = new Date(endDate);
        }

        const gstData = await prisma.invoice.aggregate({
            where,
            _sum: {
                subtotal: true,
                cgstAmount: true,
                sgstAmount: true,
                igstAmount: true,
                totalAmount: true
            },
            _count: true
        });

        const totalGst = (gstData._sum.cgstAmount || 0) +
            (gstData._sum.sgstAmount || 0) +
            (gstData._sum.igstAmount || 0);

        res.json({
            totalInvoices: gstData._count,
            subtotal: gstData._sum.subtotal || 0,
            cgstAmount: gstData._sum.cgstAmount || 0,
            sgstAmount: gstData._sum.sgstAmount || 0,
            igstAmount: gstData._sum.igstAmount || 0,
            totalGst,
            totalAmount: gstData._sum.totalAmount || 0
        });
    } catch (error) {
        next(error);
    }
});

export default router;