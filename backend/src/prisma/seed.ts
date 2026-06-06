import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Super Admin ──────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@supplychain.uz',
      phone: '+998901234567',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      role: 'SUPER_ADMIN',
      phoneVerified: true,
    },
  });
  console.log('✅ Super admin created:', superAdmin.username);

  // ── Product Categories ────────────────────────────────────────
  const categories = await Promise.all([
    prisma.productCategory.upsert({ where: { slug: 'food-drinks' }, update: {}, create: { name: 'Food & Drinks', slug: 'food-drinks' } }),
    prisma.productCategory.upsert({ where: { slug: 'household' }, update: {}, create: { name: 'Household', slug: 'household' } }),
    prisma.productCategory.upsert({ where: { slug: 'electronics' }, update: {}, create: { name: 'Electronics', slug: 'electronics' } }),
    prisma.productCategory.upsert({ where: { slug: 'clothing' }, update: {}, create: { name: 'Clothing', slug: 'clothing' } }),
    prisma.productCategory.upsert({ where: { slug: 'building-materials' }, update: {}, create: { name: 'Building Materials', slug: 'building-materials' } }),
  ]);
  console.log('✅ Categories created');

  // ── Sample Supplier ───────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { slug: 'tashkent-food-supply' },
    update: {},
    create: {
      name: 'Tashkent Food Supply',
      slug: 'tashkent-food-supply',
      description: 'Leading food distributor in Tashkent',
      address: 'Tashkent, Yunusobod district, 12-street',
      phone: '+998712345678',
      email: 'info@tfsupply.uz',
      taxId: '123456789',
      bankName: 'Ipoteka Bank',
      bankAccount: '20208000123456789',
      isActive: true,
    },
  });

  // ── Supplier Admin ────────────────────────────────────────────
  const supplierAdmin = await prisma.user.upsert({
    where: { username: 'supplier_admin' },
    update: {},
    create: {
      username: 'supplier_admin',
      email: 'admin@tfsupply.uz',
      phone: '+998901234568',
      passwordHash: await bcrypt.hash('Supplier@1234', 12),
      role: 'SUPPLIER_ADMIN',
      phoneVerified: true,
      supplierId: supplier.id,
    },
  });
  console.log('✅ Supplier + admin created');

  // ── Sample Products ───────────────────────────────────────────
  const products = [
    { name: 'Wheat Flour (Premium)', sku: 'WF-001', unit: 'kg', price: 2500, stockQty: 5000, minOrderQty: 50, categoryId: categories[0].id },
    { name: 'Sunflower Oil', sku: 'SO-001', unit: 'litre', price: 15000, stockQty: 2000, minOrderQty: 10, categoryId: categories[0].id },
    { name: 'Sugar (Refined)', sku: 'SG-001', unit: 'kg', price: 7000, stockQty: 3000, minOrderQty: 25, categoryId: categories[0].id },
    { name: 'Rice (Long Grain)', sku: 'RC-001', unit: 'kg', price: 9000, stockQty: 4000, minOrderQty: 25, categoryId: categories[0].id },
    { name: 'Tomato Paste (1L)', sku: 'TP-001', unit: 'piece', price: 12000, stockQty: 1500, minOrderQty: 12, categoryId: categories[0].id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, supplierId: supplier.id },
    });
  }
  console.log('✅ Products created');

  // ── Sample Market ─────────────────────────────────────────────
  const market = await prisma.market.upsert({
    where: { id: 'sample-market-id' },
    update: {},
    create: {
      id: 'sample-market-id',
      name: 'Baraka Supermarket',
      address: 'Tashkent, Chilanzar district, 7-street',
      phone: '+998907654321',
      email: 'baraka@market.uz',
      taxId: '987654321',
      status: 'APPROVED',
      approvedById: superAdmin.id,
      approvedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { username: 'market_admin' },
    update: {},
    create: {
      username: 'market_admin',
      email: 'admin@baraka.uz',
      phone: '+998901234569',
      passwordHash: await bcrypt.hash('Market@1234', 12),
      role: 'MARKET_ADMIN',
      phoneVerified: true,
      marketId: market.id,
    },
  });
  console.log('✅ Market + admin created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Test accounts:');
  console.log('  Super Admin  → username: superadmin      | password: Admin@1234');
  console.log('  Supplier     → username: supplier_admin  | password: Supplier@1234');
  console.log('  Market       → username: market_admin    | password: Market@1234');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
