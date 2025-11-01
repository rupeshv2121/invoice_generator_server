import express from 'express';
import { validateItem, validateItemUpdate } from '../dto/itemDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

// Get item statistics
// Get customer statistics
router.get('/stats', async (req, res, next) => {
    try {
        const where = { isActive: true };

        const [
            totalCustomers,
            newCustomersThisMonth,
            customersWithInvoices,
            gstRegisteredCount,
            // outstandingAmountData
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
                    // gstRegistered: true  // assuming this boolean column exists
                }
            }),
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


// Get all items with search and pagination
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

// // Get item by ID
// router.get('/:id', async (req, res, next) => {
//     try {
//         const item = await prisma.item.findFirst({
//             where: {
//                 id: parseInt(req.params.id),
//                 company: {
//                     userId: req.user.id
//                 }
//             },
//             include: {
//                 company: {
//                     select: { id: true, companyName: true }
//                 }
//             }
//         });

//         if (!item) {
//             return res.status(404).json({ error: 'Item not found' });
//         }

//         res.json(item);
//     } catch (error) {
//         next(error);
//     }
// });

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

        // Get user's company profile
        const userCompany = await prisma.companyProfile.findFirst({
            where: { userId: req.user.id },
            select: { id: true }
        });

        if (!userCompany) {
            return res.status(404).json({ error: 'Company profile not found. Please create a company profile first.' });
        }

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
                companyProfileId: userCompany.id, // Link to user's company
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





export default router;