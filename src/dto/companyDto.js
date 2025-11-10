import { z } from 'zod';

export const companySchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    companyName: z.string().min(1, 'Company name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(1, 'Pincode is required'),
    country: z.string().default('India'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().optional(),
    gstRegistered: z.boolean().default(false),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    iecCode: z.string().optional(),
    arn: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
    bankBranch: z.string().optional(),
    logoPath: z.string().optional()
});

export const companyUpdateSchema = companySchema.partial();

export const validateCompany = (data) => {
    return companySchema.safeParse(data);
};

export const validateCompanyUpdate = (data) => {
    return companyUpdateSchema.safeParse(data);
};