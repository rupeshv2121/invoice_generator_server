import express from 'express';
import { validateItem, validateItemUpdate } from '../dto/itemDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

// Get all items with search and pagination
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
                { description: { contains: search, mode: 'insensitive' } },
                { hsnCode: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [items, total] = await Promise.all([
            prisma.item.findMany({
                where,
                include: {
                    company: {
                        select: { id: true, companyName: true }
                    }
                },
                orderBy: { name: 'asc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.item.count({ where })
        ]);

        res.json({
            items,
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

// Get item by ID
router.get('/:id', async (req, res, next) => {
    try {
        const item = await prisma.item.findFirst({
            where: {
                id: parseInt(req.params.id),
                company: {
                    userId: req.user.id
                }
            },
            include: {
                company: {
                    select: { id: true, companyName: true }
                }
            }
        });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        next(error);
    }
});

// Create new item
router.post('/', async (req, res, next) => {
    try {
        const validation = validateItem(req.body);
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

        const item = await prisma.item.create({
            data: validation.data,
            include: {
                company: {
                    select: { id: true, companyName: true }
                }
            }
        });

        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
});

// Update item
router.patch('/:id', async (req, res, next) => {
    try {
        const validation = validateItemUpdate(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Use string ID instead of integer
        const itemId = req.params.id; // keep it as string

        // Check if item exists and belongs to user's company
        const existingItem = await prisma.item.findFirst({
            where: {
                id: itemId, // <-- string
                company: {
                    userId: req.user.id
                }
            }
        });

        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = await prisma.item.update({
            where: { id: itemId }, // <-- string
            data: validation.data,
            include: {
                company: {
                    select: { id: true, companyName: true }
                }
            }
        });

        res.json(item);
    } catch (error) {
        next(error);
    }
});


// Soft delete item
// Soft delete item
router.delete('/:id', async (req, res, next) => {
    try {
        const itemId = req.params.id; // keep it as string

        // Check if item exists and belongs to user's company
        const existingItem = await prisma.item.findFirst({
            where: {
                id: itemId, // <-- string
                company: {
                    userId: req.user.id
                }
            }
        });

        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await prisma.item.update({
            where: { id: itemId }, // <-- string
            data: { isActive: false }
        });

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        next(error);
    }
});


// Search items for autocomplete (simplified response)
router.get('/search/autocomplete', async (req, res, next) => {
    try {
        const { q = '', companyId } = req.query;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const where = {
            isActive: true,
            company: {
                userId: req.user.id
            },
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { hsnCode: { contains: q, mode: 'insensitive' } }
            ]
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        }

        const items = await prisma.item.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                hsnCode: true,
                unit: true,
                rate: true,
                cgstRate: true,
                sgstRate: true,
                igstRate: true
            },
            take: 10,
            orderBy: { name: 'asc' }
        });

        res.json(items);
    } catch (error) {
        next(error);
    }
});

// Get item statistics
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
            totalItems,
            itemsUsedInInvoices,
            averageRate
        ] = await Promise.all([
            prisma.item.count({ where }),
            prisma.item.count({
                where: {
                    ...where,
                    invoiceItems: {
                        some: {}
                    }
                }
            }),
            prisma.item.aggregate({
                where,
                _avg: { rate: true }
            })
        ]);

        res.json({
            totalItems,
            itemsUsedInInvoices,
            itemsNotUsed: totalItems - itemsUsedInInvoices,
            averageRate: averageRate._avg.rate || 0
        });
    } catch (error) {
        next(error);
    }
});

export default router;