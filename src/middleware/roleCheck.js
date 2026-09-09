const ApiError = require('../utils/ApiError');

// Uso: router.post('/products', authenticate, requireRole('ADMIN'), handler)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('No tienes permisos para esta acción'));
    }
    next();
  };
}

module.exports = requireRole;
