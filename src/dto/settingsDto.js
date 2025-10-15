import { z } from 'zod';

export const settingsSchema = z.object({
    invoicePrefix: z.string().min(1, 'Invoice prefix is required').default('INV'),
    nextInvoiceNumber: z.number().int().positive().default(1),
    defaultCgstRate: z.number().min(0).max(50).default(9),
    defaultSgstRate: z.number().min(0).max(50).default(9),
    defaultIgstRate: z.number().min(0).max(50).default(18),
    termsConditions: z.string().optional()
});

export const validateSettings = (data) => {
    return settingsSchema.safeParse(data);
};