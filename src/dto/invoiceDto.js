import { z } from 'zod';

const invoiceItemSchema = z.object({
    itemId: z.number().int().positive().optional(),
    description: z.string().min(1, 'Description is required'),
    hsnCode: z.string().optional(),
    unit: z.string().default('pcs'),
    quantity: z.number().positive('Quantity must be positive'),
    rate: z.number().positive('Rate must be positive'),
    cgstRate: z.number().min(0).max(50).default(9),
    sgstRate: z.number().min(0).max(50).default(9),
    igstRate: z.number().min(0).max(50).default(18)
});

export const invoiceSchema = z.object({
    companyProfileId: z.string().uuid().optional().or(z.literal('')).or(z.undefined()),
    customerId: z.string().uuid('Customer ID is required'),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().or(z.date()).transform((val) => new Date(val)),
    dueDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    marka: z.string().optional(),
    dateOfSupply: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    stateCode: z.string().optional(),
    transportation: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
    invoiceItems: z.array(invoiceItemSchema).min(1, 'At least one item is required')
});

export const invoiceUpdateSchema = invoiceSchema.partial().omit({ companyId: true });

export const validateInvoice = (data) => {
    return invoiceSchema.safeParse(data);
};

export const validateInvoiceUpdate = (data) => {
    return invoiceUpdateSchema.safeParse(data);
};