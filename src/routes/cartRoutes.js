const { Router } = require('express');
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const router = Router();

router.use(authenticate); // todas las rutas del carrito requieren sesión

router.get('/', asyncHandler(cartController.getCart));

router.post(
  '/items',
  [
    body('productId').isInt().withMessage('productId es requerido'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity debe ser al menos 1'),
  ],
  validate,
  asyncHandler(cartController.addItem)
);

router.put(
  '/items/:id',
  [body('quantity').isInt({ min: 0 })],
  validate,
  asyncHandler(cartController.updateItem)
);

router.delete('/items/:id', asyncHandler(cartController.removeItem));

module.exports = router;
