const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const orderService = require('../services/orderService');

async function createOrder(req, res) {
  const { addressId } = req.body;
  const order = await orderService.createOrderFromCart(req.user.id, addressId);
  res.status(201).json(order);
}

async function listMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
}

async function getOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: { include: { product: true } }, payment: true, address: true },
  });

  if (!order) throw ApiError.notFound('Orden no encontrada');
  if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  res.json(order);
}

async function updateStatus(req, res) {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(Number(req.params.id), status);
  res.json(order);
}

async function cancelOrder(req, res) {
  const order = await orderService.cancelOrder(Number(req.params.id), req.user.id);
  res.json(order);
}

module.exports = { createOrder, listMyOrders, getOrder, updateStatus, cancelOrder };
