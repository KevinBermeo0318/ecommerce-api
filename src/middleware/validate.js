const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Se coloca después de las reglas de express-validator en cada ruta
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest('Datos inválidos', errors.array()));
  }
  next();
}

module.exports = validate;
