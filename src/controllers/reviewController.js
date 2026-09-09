const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listReviews(req, res) {
  const reviews = await prisma.review.findMany({
    where: { productId: Number(req.params.productId) },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
}

async function createReview(req, res) {
  const productId = Number(req.params.productId);
  const { rating, comment } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Producto no encontrado');

  // Regla de negocio: solo puede reseñar quien haya comprado el producto
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: req.user.id, status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
    },
  });
  if (!purchased) {
    throw ApiError.forbidden('Solo puedes reseñar productos que hayas comprado');
  }

  const review = await prisma.review.create({
    data: { productId, userId: req.user.id, rating, comment },
  });

  res.status(201).json(review);
}

module.exports = { listReviews, createReview };
