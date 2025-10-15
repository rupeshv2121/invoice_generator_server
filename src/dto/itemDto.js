import { z } from 'zod';

export const itemSchema = z.object({
    companyId: z.number().int().positive('Company ID is required'),
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    hsnCode: z.number().positive("HSN Code is required"),
    unit: z.string().default('pcs'),
    purchaseRate: z.number().positive('Rate must be positive'),
    sellingRate: z.number().positive('Rate must be positive'),
    cgstRate: z.number().min(0).max(50).default(9),
    sgstRate: z.number().min(0).max(50).default(9),
    igstRate: z.number().min(0).max(50).default(18)
});

export const itemUpdateSchema = itemSchema.partial().omit({ companyId: true });

export const validateItem = (data) => {
    return itemSchema.safeParse(data);
};

export const validateItemUpdate = (data) => {
    return itemUpdateSchema.safeParse(data);
};