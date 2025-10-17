import express from 'express';
import prisma from '../utils/prismaClient.js';
import { supabase } from '../utils/supabaseClient.js';


const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) return res.status(400).json({ error: error.message });

        // Optional: create profile in your database
        await prisma.profiles.create({
            data: {
                id: data.user.id,
                userId: data.user.id,
                fullName: name,
            }
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: data.user.id, email: data.user.email },
            access_token: data.session?.access_token // may be null if email confirmation is required
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