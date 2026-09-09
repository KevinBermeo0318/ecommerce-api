const { PrismaClient } = require('@prisma/client');

// Patrón singleton: evita crear múltiples conexiones en desarrollo con nodemon
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
