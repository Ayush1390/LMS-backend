import {Router} from 'express';
import { allPayments, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from '../controllers/payment.controller.js';
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/razorpay-key',isLoggedIn,getRazorpayApiKey);

router.post('/subscribe',isLoggedIn,buySubscription);

router.post('/verify',isLoggedIn,verifySubscription);

router.post('/unsubscribe',isLoggedIn,cancelSubscription);

router.get('/',isLoggedIn,authorizedRoles('ADMIN'),allPayments);



export default router;