import express from 'express';
import prisma from '../utils/prismaClient.js';
import { supabase } from '../utils/supabaseClient.js';


const router = express.Router();

// Dev bypass for Supabase email confirmation. Defaults ON outside production.
// Set AUTH_AUTOCONFIRM=false to restore the real signUp + confirmation-email flow.
const AUTO_CONFIRM_EMAIL = process.env.AUTH_AUTOCONFIRM
    ? process.env.AUTH_AUTOCONFIRM === 'true'
    : process.env.NODE_ENV !== 'production';

const syncUserRecord = async (authUserId) => {
    try {
        await prisma.user.upsert({
            where: { authId: authUserId },
            update: {
                authId: authUserId,
            },
            create: {
                authId: authUserId,
                role: 'USER',
            },
        });
    } catch (error) {
        console.warn('User sync skipped:', error?.message || error);
    }
};

// Register
router.post('/register', async (req, res, next) => {
    try {
        const {
            email,
            password,
            name,
            fullName,
            phone,
            companyName,
            gstRegistered,
            gstin,
        } = req.body;

        const metadata = {
            fullName: name || fullName || '',
            phone: phone || null,
            companyName: companyName || '',
            gstRegistered: Boolean(gstRegistered),
            gstin: gstin || null,
        };

        let user;
        let session;

        if (AUTO_CONFIRM_EMAIL) {
            // DEV BYPASS: Supabase's built-in mailer refuses to deliver to addresses
            // outside the project team, so confirmation links never arrive locally.
            // Create the user pre-confirmed via the admin API and mint a session
            // immediately so registration flows straight into the app.
            const { data: created, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: metadata,
            });

            if (createError) return res.status(400).json({ error: createError.message });

            user = created.user;

            const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) return res.status(400).json({ error: signInError.message });

            session = signedIn.session;
        } else {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: metadata },
            });

            if (error) return res.status(400).json({ error: error.message });

            user = data.user;
            session = data.session;
        }

        await syncUserRecord(user.id);

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, name: name || fullName || '' },
            access_token: session?.access_token, // may be null if email confirmation is required
            refresh_token: session?.refresh_token
        });
    } catch (err) {
        next(err);
    }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) return res.status(401).json({ error: error.message });

        await syncUserRecord(data.user.id);

        res.json({
            message: 'Login successful',
            user: { id: data.user.id, email: data.user.email },
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token
        });
    } catch (err) {
        next(err);
    }
});


// Get current user
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) return res.status(401).json({ error: 'No token provided' });

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });

        res.json({ user: data.user });
    } catch (err) {
        next(err);
    }
});

export default router;