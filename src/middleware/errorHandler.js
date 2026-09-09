const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details || undefined,
    });
  }

  // Errores conocidos de Prisma (ej: violación de unique constraint)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con ese valor único',
      field: err.meta?.target,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  console.error(err); // errores no esperados, quedan en logs para debug
  return res.status(500).json({ error: 'Error interno del servidor' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
