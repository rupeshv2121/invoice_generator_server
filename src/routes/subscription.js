import express from 'express';
import SubscriptionService from '../services/subscriptionService.js';

const router = express.Router();

/**
 * Get current user's subscription
 */
router.get('/current', async (req, res, next) => {
  try {
    const subscription = await SubscriptionService.getSubscription(req.user.id);

    if (!subscription) {
      return res.json({
        status: 'none',
        message: 'No active subscription',
        isActive: false,
      });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    next(error);
  }
});

/**
 * Get all available plans
 */
router.get('/plans', async (req, res, next) => {
  try {
    const plans = SubscriptionService.getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    next(error);
  }
});

/**
 * Create trial subscription (called after setup completion)
 */
router.post('/trial', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if subscription already exists
    const existing = await SubscriptionService.getSubscription(userId);

    if (existing) {
      return res.status(400).json({
        error: 'Subscription already exists',
        message: 'You already have an active subscription',
      });
    }

    const subscription = await SubscriptionService.createTrialSubscription(userId);

    res.status(201).json({
      success: true,
      subscription,
      message: 'Free trial started! You have 7 days to try all features.',
    });
  } catch (error) {
    console.error('Create trial error:', error);
    next(error);
  }
});

/**
 * Get subscription status (for quick checks)
 */
router.get('/status', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const hasActive = await SubscriptionService.hasActiveSubscription(userId);
    const subscription = await SubscriptionService.getSubscription(userId);

    res.json({
      hasActive,
      status: subscription?.status || 'none',
      plan: subscription?.plan || 'FREE',
      daysRemaining: subscription?.daysRemaining || 0,
      invoicesRemaining: await SubscriptionService.getRemainingInvoices(userId),
    });
  } catch (error) {
    console.error('Get status error:', error);
    next(error);
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await SubscriptionService.cancelSubscription(userId);

    res.json({
      success: true,
      subscription,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    next(error);
  }
});

export default router;
