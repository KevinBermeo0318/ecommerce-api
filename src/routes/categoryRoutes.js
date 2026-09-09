const { Router } = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const router = Router();

router.get('/', asyncHandler(categoryController.listCategories));

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  [body('name').trim().notEmpty()],
  validate,
  asyncHandler(categoryController.createCategory)
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(categoryController.deleteCategory)
);

module.exports = router;
