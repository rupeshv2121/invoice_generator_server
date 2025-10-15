import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { validateLogin, validateUser } from '../dto/userDto.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
    try {
        const validation = validateUser(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const { email, password, name } = validation.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        // Generate JWT access_token
        const access_token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user,
            access_token
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const validation = validateLogin(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const { email, password } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT access_token
        const access_token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            access_token
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const access_token = authHeader && authHeader.split(' ')[1];

        if (!access_token) {
            return res.status(401).json({ error: 'No access_token provided' });
        }

        const decoded = jwt.verify(access_token, process.env.JWT_SECRET || 'your-secret-key');

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
});

// Refresh access_token
router.post('/refresh', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const access_token = authHeader && authHeader.split(' ')[1];

        if (!access_token) {
            return res.status(401).json({ error: 'No access_token provided' });
        }

        const decoded = jwt.verify(access_token, process.env.JWT_SECRET || 'your-secret-key');

        // Generate new access_token
        const newaccess_token = jwt.sign(
            { userId: decoded.userId, email: decoded.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({ access_token: newaccess_token });
    } catch (error) {
        next(error);
    }
});

export default router;