import SubscriptionService from '../services/subscriptionService.js';

/**
 * Middleware to check if user has an active subscription
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const hasActive = await SubscriptionService.hasActiveSubscription(userId);

    if (!hasActive) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Please subscribe to access this feature',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    // Attach subscription info to request for later use
    req.subscription = await SubscriptionService.getSubscription(userId);
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

/**
 * Middleware to check if user can create invoice (limit check)
 */
export const checkInvoiceLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const canCreate = await SubscriptionService.canCreateInvoice(userId);

    if (!canCreate) {
      const remaining = await SubscriptionService.getRemainingInvoices(userId);

      return res.status(403).json({
        error: 'Invoice limit reached',
        message: remaining === 0
          ? 'You have reached your invoice limit. Upgrade your plan to create more invoices.'
          : 'Your subscription has expired. Please renew to continue.',
        code: 'LIMIT_REACHED',
        remaining,
      });
    }

    next();
  } catch (error) {
    console.error('Invoice limit check error:', error);
    res.status(500).json({ error: 'Failed to check invoice limit' });
  }
};

/**
 * Middleware to check customer limit
 */
export const checkCustomerLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = await SubscriptionService.getSubscription(userId);

    if (!subscription || !subscription.isActive) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Please subscribe to add customers',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    // If unlimited, allow
    if (subscription.customersLimit === -1) {
      return next();
    }

    // Count current customers
    const customerCount = await req.prisma?.customer.count({
      where: { companyProfileId: req.user.company?.id },
    });

    if (customerCount >= subscription.customersLimit) {
      return res.status(403).json({
        error: 'Customer limit reached',
        message: 'Upgrade your plan to add more customers',
        code: 'LIMIT_REACHED',
      });
    }

    next();
  } catch (error) {
    console.error('Customer limit check error:', error);
    res.status(500).json({ error: 'Failed to check customer limit' });
  }
};

/**
 * Middleware to check item limit
 */
export const checkItemLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = await SubscriptionService.getSubscription(userId);

    if (!subscription || !subscription.isActive) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Please subscribe to add items',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    // If unlimited, allow
    if (subscription.itemsLimit === -1) {
      return next();
    }

    // Count current items
    const itemCount = await req.prisma?.item.count({
      where: { companyProfileId: req.user.company?.id },
    });

    if (itemCount >= subscription.itemsLimit) {
      return res.status(403).json({
        error: 'Item limit reached',
        message: 'Upgrade your plan to add more items',
        code: 'LIMIT_REACHED',
      });
    }

    next();
  } catch (error) {
    console.error('Item limit check error:', error);
    res.status(500).json({ error: 'Failed to check item limit' });
  }
};
