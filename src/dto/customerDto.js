import { z } from 'zod';

export const customerSchema = z.object({
    companyId: z.number().int().positive('Company ID is required'),
    name: z.string().min(1, 'Customer name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    contactPerson: z.string().optional()
});

export const customerUpdateSchema = customerSchema.partial().omit({ companyId: true });

export const validateCustomer = (data) => {
    return customerSchema.safeParse(data);
};

export const validateCustomerUpdate = (data) => {
    return customerUpdateSchema.safeParse(data);
};