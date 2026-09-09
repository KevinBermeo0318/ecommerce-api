const { Router } = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const router = Router();

const productRules = [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ gt: 0 }).withMessage('El precio debe ser mayor a 0'),
  body('stock').isInt({ min: 0 }).withMessage('El stock no puede ser negativo'),
  body('sku').trim().notEmpty(),
  body('categoryId').isInt().withMessage('categoryId es requerido'),
];

router.get('/', asyncHandler(productController.listProducts));
router.get('/:id', asyncHandler(productController.getProduct));
router.get('/:productId/reviews', asyncHandler(reviewController.listReviews));

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  productRules,
  validate,
  asyncHandler(productController.createProduct)
);

router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(productController.updateProduct)
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(productController.deleteProduct)
);

router.post(
  '/:productId/reviews',
  authenticate,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating debe ser entre 1 y 5'),
    body('comment').optional().trim(),
  ],
  validate,
  asyncHandler(reviewController.createReview)
);

module.exports = router;
