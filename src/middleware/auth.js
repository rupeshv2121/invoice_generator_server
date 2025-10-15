import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const access_token = authHeader && authHeader.split(' ')[1]; // Bearer access_token

        if (!access_token) {
            return res.status(401).json({ error: 'Access access_token required' });
        }

        const decoded = jwt.verify(access_token, process.env.JWT_SECRET || 'your-secret-key');

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(403).json({ error: 'Invalid access_token' });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};