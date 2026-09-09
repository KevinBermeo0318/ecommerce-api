const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

// NOTA: esto es un simulador de pagos. Para producción, reemplaza createPaymentIntent
// por una llamada real a la API de Stripe/PayPal (stripe.paymentIntents.create),
// y verifica la firma del webhook con stripe.webhooks.constructEvent.

async function createPaymentIntent(req, res) {
  const { orderId, method } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Orden no encontrada');
  if (order.userId !== req.user.id) throw ApiError.forbidden();
  if (order.status !== 'PENDING') throw ApiError.conflict('La orden no está pendiente de pago');

  const payment = await prisma.payment.create({
    data: {
      orderId,
      method,
      amount: order.total,
      status: 'pending',
      transactionId: `sim_${Date.now()}_${orderId}`,
    },
  });

  res.status(201).json(payment);
}

// Simula el webhook que confirmaría el pago desde el proveedor real
async function webhook(req, res) {
  const { transactionId, status } = req.body;

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw ApiError.notFound('Pago no encontrado');

  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status } }),
    ...(status === 'succeeded'
      ? [prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } })]
      : []),
  ]);

  res.json({ received: true });
}

module.exports = { createPaymentIntent, webhook };
