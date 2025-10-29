import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
    sameAsBilling: z.boolean().optional()
});

const bankSchema = z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional()
});

export const customerSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    companyName: z.string().min(1, 'Company name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
    phone: z.string().optional(),
    email: z.union([z.string().email().optional(), z.literal('')]),
    EximCode: z.string().optional(),
    gstin: z.string().optional(),
    pan: z.string().optional()
}).strip();

export const customerUpdateSchema = customerSchema.partial();

export const validateCustomer = (data) => {
    return customerSchema.safeParse(data);
};

export const validateCustomerUpdate = (data) => {
    return customerUpdateSchema.safeParse(data);
};
