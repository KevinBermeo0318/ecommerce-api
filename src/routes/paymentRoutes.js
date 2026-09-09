const { Router } = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const router = Router();

router.post(
  '/create-intent',
  authenticate,
  [
    body('orderId').isInt(),
    body('method').isIn(['card', 'paypal']).withMessage('Método de pago no soportado'),
  ],
  validate,
  asyncHandler(paymentController.createPaymentIntent)
);

// El webhook NO lleva middleware de auth: lo autentica el proveedor de pagos
// (en producción, valida la firma con stripe.webhooks.constructEvent)
router.post('/webhook', asyncHandler(paymentController.webhook));

module.exports = router;
