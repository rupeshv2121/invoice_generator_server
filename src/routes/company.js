import express from 'express';
import { validateCompany, validateCompanyUpdate } from '../dto/companyDto.js';
import prisma from '../utils/prismaClient.js';
const router = express.Router();


// Get all companies for current user
router.get('/', async (req, res, next) => {
    try {
        const companies = await prisma.company.findMany({
            where: {
                userId: req.user.id,
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(companies);
    } catch (error) {
        next(error);
    }
});

// Get company by ID
router.get('/:id', async (req, res, next) => {
    try {
        const company = await prisma.company.findFirst({
            where: {
                id: parseInt(req.params.id),
                userId: req.user.id
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        next(error);
    }
});

// Create new company
router.post('/', async (req, res, next) => {
    try {
        const validation = validateCompany(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const company = await prisma.company.create({
            data: {
                ...validation.data,
                userId: req.user.id
            }
        });

        res.status(201).json(company);
    } catch (error) {
        next(error);
    }
});

// Update company
router.patch('/:id', async (req, res, next) => {
    try {
        const validation = validateCompanyUpdate(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Check if company exists and belongs to user
        const existingCompany = await prisma.company.findFirst({
            where: {
                id: parseInt(req.params.id),
                userId: req.user.id
            }
        });

        if (!existingCompany) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const company = await prisma.company.update({
            where: { id: parseInt(req.params.id) },
            data: validation.data
        });

        res.json(company);
    } catch (error) {
        next(error);
    }
});

// Soft delete company
router.delete('/:id', async (req, res, next) => {
    try {
        // Check if company exists and belongs to user
        const existingCompany = await prisma.company.findFirst({
            where: {
                id: parseInt(req.params.id),
                userId: req.user.id
            }
        });

        if (!existingCompany) {
            return res.status(404).json({ error: 'Company not found' });
        }

        await prisma.company.update({
            where: { id: parseInt(req.params.id) },
            data: { isActive: false }
        });

        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get company profile (main company for user)
router.get('/profile/main', async (req, res, next) => {
    try {
        const company = await prisma.company.findFirst({
            where: {
                userId: req.user.id,
                isActive: true
            },
            orderBy: { createdAt: 'asc' } // Get the first created company as main
        });

        if (!company) {
            return res.status(404).json({ error: 'No company profile found' });
        }

        res.json(company);
    } catch (error) {
        next(error);
    }
});

export default router;