
import prisma from '../utils/prismaClient.js';

export const generateInvoiceNumber = async (companyId) => {
    try {
        // Get or create settings for the company
        let settings = await prisma.settings.findUnique({
            where: { companyId }
        });

        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    companyId,
                    invoicePrefix: 'INV',
                    nextInvoiceNumber: 1
                }
            });
        }

        const invoiceNumber = `${settings.invoicePrefix}-${settings.nextInvoiceNumber.toString().padStart(4, '0')}`;

        // Update next invoice number
        await prisma.settings.update({
            where: { companyId },
            data: {
                nextInvoiceNumber: settings.nextInvoiceNumber + 1
            }
        });

        return invoiceNumber;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback to timestamp-based number
        return `INV-${Date.now()}`;
    }
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

export const calculateInvoiceTotals = (items) => {
    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    items.forEach(item => {
        const amount = item.quantity * item.rate;
        const cgst = (amount * item.cgstRate) / 100;
        const sgst = (amount * item.sgstRate) / 100;
        const igst = (amount * item.igstRate) / 100;

        subtotal += amount;
        cgstAmount += cgst;
        sgstAmount += sgst;
        igstAmount += igst;
    });

    const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

    return {
        subtotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount
    };
};