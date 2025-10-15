import { z } from 'zod';

export const userSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(1, 'Name is required').optional()
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

export const validateUser = (data) => {
    return userSchema.safeParse(data);
};

export const validateLogin = (data) => {
    return loginSchema.safeParse(data);
};