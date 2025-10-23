
import { supabase } from '../utils/supabaseClient.js';

export async function supabaseAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    try {
        const { data, error } = await supabase.auth.getUser(token);

        // console.log('Token:', token);
        // console.log('Supabase getUser data:', data, 'error:', error);

        if (error || !data.user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = data.user;
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