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
            isActive: true
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

        const { name, hsnCode, purchasePrice, sellingPrice, unit, cgstRate, sgstRate, igstRate, description } = validation.data;

        // Company is optional, so we don't need to fetch or create it

        const newItem = await prisma.item.create({
            data: {
                name,
                description,
                hsnCode: parseInt(hsnCode),
                purchasePrice,
                sellingPrice,
                unit,
                cgstRate,
                sgstRate,
                igstRate,
                companyId: null, // Company is optional
                isActive: true
            }
        });

        console.log("Backend New Item : ", newItem)
        res.status(201).json({ success: true, item: newItem });
    } catch (error) {
        next(error);
    }
});

// Update item
router.patch('/:id', async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'No data provided for update' });
        }

        const validation = validateItemUpdate(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const itemId = req.params.id;

        const existingItem = await prisma.item.findUnique({
            where: { id: itemId }
        });

        console.log("Existing Item for Update : ", existingItem)

        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = await prisma.item.update({
            where: { id: itemId },
            data: validation.data,
        });

        console.log("Backend Updated Item : ", updatedItem)

        res.status(201).json({
            success: true,
            message: 'Item updated successfully',
            item: updatedItem
        });

    } catch (error) {
        console.error('Error updating item:', error);
        next(error);
    }
});


// Soft delete item
router.delete('/:id', async (req, res, next) => {
    try {
        const itemId = req.params.id; // keep it as string
        console.log("Deleting item with ID : ", itemId)

        // Check if item exists and belongs to user's company
        // const existingItem = await prisma.item.findFirst({
        //     where: {
        //         id: itemId, // <-- string
        //         company: {
        //             userId: req.user.id
        //         }
        //     }
        // });

        const existingItem = await prisma.item.findFirst({
            where: { id: req.params.id }
        });
        console.log("Deleting item  : ", existingItem)

        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await prisma.item.update({
            where: { id: itemId }, // <-- string
            data: { isActive: false }
        });

        res.status(200).json({ message: 'Item deleted successfully' });
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
router.get('/stats', async (req, res, next) => {
    try {
        const { companyId } = req.query;

        // Base filter
        let where = {
            isActive: true
        };

        if (companyId) {
            where.companyId = parseInt(companyId);
        } else {
            // Filter items that either belong to user's companies OR have null companyId
            where.OR = [
                { companyId: null },
                { company: { userId: req.user.id } }
            ];
        }

        const [totalItems, itemsUsedInInvoices, averageRate] = await Promise.all([
            prisma.item.count({ where }),
            prisma.item.count({
                where: {
                    ...where,
                    invoiceItems: { some: {} }
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