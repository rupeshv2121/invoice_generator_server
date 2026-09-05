import { z } from 'zod';

export const itemSchema = z.object({
    companyId: z.string().optional(),
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    hsnCode: z.union([z.string(), z.number()]).transform(val => parseInt(val)),
    unit: z.string().default('pcs'),
    purchasePrice: z.union([z.string(), z.number()]).transform(val => parseFloat(val)),
    sellingPrice: z.union([z.string(), z.number()]).transform(val => parseFloat(val)),
    cgstRate: z.union([z.string(), z.number()]).transform(val => parseFloat(val)).default(9),
    sgstRate: z.union([z.string(), z.number()]).transform(val => parseFloat(val)).default(9),
    igstRate: z.union([z.string(), z.number()]).transform(val => parseFloat(val)).default(18)
});

export const itemUpdateSchema = itemSchema.partial().omit({ companyId: true });

export const validateItem = (data) => {
    return itemSchema.safeParse(data);
};

export const validateItemUpdate = (data) => {
    console.log("Validating Item Update : ", data)
    return itemUpdateSchema.safeParse(data);
};