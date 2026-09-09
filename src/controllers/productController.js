const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listProducts(req, res) {
  const { category, minPrice, maxPrice, search, page = 1, limit = 20, sort = 'createdAt' } = req.query;

  const where = { active: true };
  if (category) where.categoryId = Number(category);
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const take = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * take;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: 'desc' },
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    pagination: { page: pageNum, limit: take, total, totalPages: Math.ceil(total / take) },
  });
}

async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { category: true, reviews: { include: { user: { select: { id: true, name: true } } } } },
  });
  if (!product) throw ApiError.notFound('Producto no encontrado');
  res.json(product);
}

async function createProduct(req, res) {
  const { name, description, price, stock, sku, categoryId, imageUrl } = req.body;

  const product = await prisma.product.create({
    data: { name, description, price, stock, sku, categoryId, imageUrl },
  });

  res.status(201).json(product);
}

async function updateProduct(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Producto no encontrado');

  const product = await prisma.product.update({
    where: { id },
    data: req.body,
  });

  res.json(product);
}

async function deleteProduct(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Producto no encontrado');

  // Soft delete: se marca inactivo en lugar de borrar, para preservar historial de órdenes
  await prisma.product.update({ where: { id }, data: { active: false } });

  res.status(204).send();
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
