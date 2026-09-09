const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@shop.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const electronics = await prisma.category.upsert({
    where: { name: 'Electrónica' },
    update: {},
    create: { name: 'Electrónica' },
  });

  await prisma.product.upsert({
    where: { sku: 'LAPTOP-001' },
    update: {},
    create: {
      name: 'Laptop Pro 14"',
      description: 'Laptop de alto rendimiento para desarrollo y diseño',
      price: 1299.99,
      stock: 15,
      sku: 'LAPTOP-001',
      categoryId: electronics.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'MOUSE-001' },
    update: {},
    create: {
      name: 'Mouse inalámbrico',
      description: 'Mouse ergonómico con batería de larga duración',
      price: 29.99,
      stock: 50,
      sku: 'MOUSE-001',
      categoryId: electronics.id,
    },
  });

  console.log('✅ Seed completado. Admin: admin@shop.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
