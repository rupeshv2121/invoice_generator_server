import prisma from '../utils/prismaClient.js';

class SubscriptionService {
  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    const now = new Date();

    // Check if trial is active
    if (subscription.status === 'TRIAL' && subscription.trialEndDate) {
      return now < new Date(subscription.trialEndDate);
    }

    // Check if subscription is active and not expired
    if (subscription.status === 'ACTIVE' && subscription.endDate) {
      return now < new Date(subscription.endDate);
    }

    return subscription.status === 'ACTIVE';
  }

  /**
   * Get subscription details with active status
   */
  static async getSubscription(userId) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            authId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!subscription) return null;

    const isActive = await this.hasActiveSubscription(userId);
    const daysRemaining = this.getDaysRemaining(subscription);

    return {
      ...subscription,
      isActive,
      daysRemaining,
    };
  }

  /**
   * Get days remaining for trial or subscription
   */
  static getDaysRemaining(subscription) {
    const now = new Date();
    let endDate;

    if (subscription.status === 'TRIAL' && subscription.trialEndDate) {
      endDate = new Date(subscription.trialEndDate);
    } else if (subscription.endDate) {
      endDate = new Date(subscription.endDate);
    } else {
      return null;
    }

    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Create trial subscription (7 days)
   */
  static async createTrialSubscription(userId) {
    // Check if subscription already exists
    const existing = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new Error('Subscription already exists for this user');
    }

    const trialDays = 7;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    return await prisma.subscription.create({
      data: {
        userId,
        plan: 'FREE',
        status: 'TRIAL',
        trialEndDate,
        amount: 0,
        invoiceLimit: 10,
        invoicesUsed: 0,
        customersLimit: 50,
        itemsLimit: 100,
      },
    });
  }

  /**
   * Activate paid subscription
   */
  static async activateSubscription(userId, plan, paymentId) {
    const planDetails = this.getPlanDetails(plan);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    return await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'ACTIVE',
        amount: planDetails.price,
        startDate,
        endDate,
        nextBillingDate: endDate,
        invoiceLimit: planDetails.invoiceLimit,
        customersLimit: planDetails.customersLimit,
        itemsLimit: planDetails.itemsLimit,
        lastPaymentDate: startDate,
      },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        amount: planDetails.price,
        startDate,
        endDate,
        nextBillingDate: endDate,
        invoiceLimit: planDetails.invoiceLimit,
        customersLimit: planDetails.customersLimit,
        itemsLimit: planDetails.itemsLimit,
        lastPaymentDate: startDate,
      },
    });
  }

  /**
   * Get plan pricing and limits
   */
  static getPlanDetails(plan) {
    const plans = {
      FREE: {
        name: 'Free Trial',
        price: 0,
        invoiceLimit: 10,
        customersLimit: 50,
        itemsLimit: 100,
        features: [
          'Up to 10 invoices during trial',
          'Basic invoicing',
          '50 customers',
          '100 items',
          'Email support',
          'PDF generation',
        ],
      },
      BASIC: {
        name: 'Basic',
        price: 499,
        invoiceLimit: 100,
        customersLimit: 200,
        itemsLimit: 500,
        features: [
          'Up to 100 invoices/month',
          'GST compliance',
          '200 customers',
          '500 items',
          'Email support',
          'PDF downloads',
          'Custom templates',
        ],
      },
      PROFESSIONAL: {
        name: 'Professional',
        price: 999,
        invoiceLimit: -1, // unlimited
        customersLimit: -1,
        itemsLimit: -1,
        features: [
          'Unlimited invoices',
          'Unlimited customers',
          'Unlimited items',
          'Custom branding',
          'Priority support',
          'Advanced analytics',
          'Export reports',
        ],
      },
      ENTERPRISE: {
        name: 'Enterprise',
        price: 2499,
        invoiceLimit: -1,
        customersLimit: -1,
        itemsLimit: -1,
        features: [
          'Everything in Professional',
          'Dedicated support',
          'API access',
          'Multi-user accounts',
          'White label option',
          'Custom integrations',
        ],
      },
    };

    return plans[plan] || plans.FREE;
  }

  /**
   * Check if user can create invoice (limit check)
   */
  static async canCreateInvoice(userId) {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    const hasActive = subscription.isActive;
    if (!hasActive) return false;

    // Unlimited invoices
    if (subscription.invoiceLimit === -1) return true;

    // Check limit
    return subscription.invoicesUsed < subscription.invoiceLimit;
  }

  /**
   * Increment invoice usage
   */
  static async incrementInvoiceUsage(userId) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    // Don't increment if unlimited
    if (subscription.invoiceLimit === -1) {
      return subscription;
    }

    return await prisma.subscription.update({
      where: { userId },
      data: {
        invoicesUsed: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get remaining invoice count
   */
  static async getRemainingInvoices(userId) {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return 0;

    if (subscription.invoiceLimit === -1) return Infinity;

    return Math.max(0, subscription.invoiceLimit - subscription.invoicesUsed);
  }

  /**
   * Expire trial or subscription
   */
  static async expireSubscription(userId) {
    return await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId) {
    return await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Get all plans for pricing page
   */
  static getAllPlans() {
    return ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'].map((plan) => ({
      name: plan,
      ...this.getPlanDetails(plan),
    }));
  }
}

export default SubscriptionService;
