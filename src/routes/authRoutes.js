const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  asyncHandler(authController.login)
);

router.post('/refresh', asyncHandler(authController.refresh));

module.exports = router;
