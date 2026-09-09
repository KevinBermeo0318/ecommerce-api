const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listCategories(req, res) {
  const categories = await prisma.category.findMany({
    include: { children: true },
    where: { parentId: null }, // solo categorías raíz, con sus hijas anidadas
  });
  res.json(categories);
}

async function createCategory(req, res) {
  const { name, parentId } = req.body;
  const category = await prisma.category.create({
    data: { name, parentId: parentId || null },
  });
  res.status(201).json(category);
}

async function deleteCategory(req, res) {
  const id = Number(req.params.id);
  const productsCount = await prisma.product.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    throw ApiError.conflict('No se puede borrar una categoría con productos asociados');
  }
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listCategories, createCategory, deleteCategory };
