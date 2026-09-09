const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

// Transiciones válidas de estado — evita saltos ilógicos como delivered -> pending
const VALID_TRANSITIONS = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

async function createOrderFromCart(userId, addressId) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('El carrito está vacío');
  }

  // Transacción: valida y descuenta stock, crea orden e items de forma atómica.
  // Esto evita condiciones de carrera si dos usuarios compran el último stock a la vez.
  const order = await prisma.$transaction(async (tx) => {
    let total = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });

      if (!product || !product.active) {
        throw ApiError.badRequest(`Producto no disponible: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw ApiError.conflict(`Stock insuficiente para "${product.name}"`);
      }

      // Descuenta stock de forma atómica dentro de la transacción
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });

      const unitPrice = product.price; // snapshot del precio actual
      total += unitPrice * item.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId: addressId || null,
        total,
        status: 'PENDING',
        items: { create: orderItemsData },
      },
      include: { items: { include: { product: true } } },
    });

    // Vacía el carrito tras crear la orden
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return order;
}

async function updateOrderStatus(orderId, newStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Orden no encontrada');

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Transición inválida: no se puede pasar de ${order.status} a ${newStatus}`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
}

async function cancelOrder(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw ApiError.notFound('Orden no encontrada');
  if (order.userId !== userId) throw ApiError.forbidden();
  if (!['PENDING', 'PAID'].includes(order.status)) {
    throw ApiError.badRequest('Esta orden ya no puede cancelarse');
  }

  // Repone el stock al cancelar
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  });

  return { ...order, status: 'CANCELLED' };
}

module.exports = { createOrderFromCart, updateOrderStatus, cancelOrder, VALID_TRANSITIONS };
