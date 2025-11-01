
import { supabase } from '../utils/supabaseClient.js';

export async function supabaseAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = data.user;

        // --- Auto-provision user in local User table if not present ---
        try {
            const prisma = (await import('../utils/prismaClient.js')).default;
            const userId = data.user.id;
            // Try to find user in local User table
            let localUser = await prisma.user.findUnique({ where: { id: userId } });
            if (!localUser) {
                // Insert user with minimal info; adjust fields as needed
                localUser = await prisma.user.create({
                    data: {
                        id: userId,
                        authId: userId,
                        role: 'user',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            }
        } catch (provisionErr) {
            console.error('User auto-provisioning error:', provisionErr);
            // Optionally: return error here if you want to block login on DB issues
        }

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

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