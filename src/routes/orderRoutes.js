const { Router } = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [body('addressId').optional().isInt()],
  validate,
  asyncHandler(orderController.createOrder)
);

router.get('/', asyncHandler(orderController.listMyOrders));
router.get('/:id', asyncHandler(orderController.getOrder));

router.put(
  '/:id/status',
  requireRole('ADMIN'),
  [body('status').isIn(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])],
  validate,
  asyncHandler(orderController.updateStatus)
);

router.post('/:id/cancel', asyncHandler(orderController.cancelOrder));

module.exports = router;
