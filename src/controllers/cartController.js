const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function getCart(req, res) {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
  });

  const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  res.json({ ...cart, total });
}

async function addItem(req, res) {
  const { productId, quantity } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) throw ApiError.notFound('Producto no disponible');
  if (product.stock < quantity) throw ApiError.badRequest('Stock insuficiente');

  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });

  // upsert: si el producto ya está en el carrito, suma la cantidad
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  let item;
  if (existingItem) {
    item = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  res.status(201).json(item);
}

async function updateItem(req, res) {
  const itemId = Number(req.params.id);
  const { quantity } = req.body;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item || item.cart.userId !== req.user.id) throw ApiError.notFound('Item no encontrado');

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return res.status(204).send();
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  res.json(updated);
}

async function removeItem(req, res) {
  const itemId = Number(req.params.id);

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item || item.cart.userId !== req.user.id) throw ApiError.notFound('Item no encontrado');

  await prisma.cartItem.delete({ where: { id: itemId } });
  res.status(204).send();
}

module.exports = { getCart, addItem, updateItem, removeItem };
