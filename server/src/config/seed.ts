import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seed...');

    // ============================
    // 1. Create Super Admin
    // ============================
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO admins (name, email, password, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Super Admin', 'admin@nijerbazaar.com', hashedPassword, 'super_admin', true]);
    console.log('✅ Super Admin created: admin@nijerbazaar.com / admin123');

    // ============================
    // 2. Create Categories
    // ============================
    const categories = [
      { name: 'Electronics', slug: 'electronics', sort_order: 1 },
      { name: 'Fashion', slug: 'fashion', sort_order: 2 },
      { name: 'Home & Living', slug: 'home-living', sort_order: 3 },
      { name: 'Beauty & Health', slug: 'beauty-health', sort_order: 4 },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors', sort_order: 5 },
      { name: 'Books & Stationery', slug: 'books-stationery', sort_order: 6 },
      { name: 'Food & Grocery', slug: 'food-grocery', sort_order: 7 },
      { name: 'Toys & Kids', slug: 'toys-kids', sort_order: 8 },
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (name, slug, sort_order, is_active, is_featured)
        VALUES ($1, $2, $3, true, true)
        ON CONFLICT (slug) DO NOTHING
      `, [cat.name, cat.slug, cat.sort_order]);
    }
    console.log('✅ Categories created');

    // ============================
    // 3. Create Courier Partners
    // ============================
    const couriers = [
      { name: 'Pathao', inside_dhaka: 60, outside_dhaka: 120 },
      { name: 'Steadfast', inside_dhaka: 60, outside_dhaka: 110 },
      { name: 'Redx', inside_dhaka: 55, outside_dhaka: 110 },
      { name: 'Sundarban Courier', inside_dhaka: 70, outside_dhaka: 130 },
      { name: 'SA Paribahan', inside_dhaka: 65, outside_dhaka: 115 },
    ];

    for (const courier of couriers) {
      await client.query(`
        INSERT INTO couriers (name, inside_dhaka_charge, outside_dhaka_charge, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT DO NOTHING
      `, [courier.name, courier.inside_dhaka, courier.outside_dhaka]);
    }
    console.log('✅ Courier partners created');

    // ============================
    // 4. Create Sample Products
    // ============================
    const categoryResult = await client.query('SELECT id FROM categories WHERE slug = $1', ['electronics']);
    const electronicsId = categoryResult.rows[0]?.id || 1;

    const sampleProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        price: 2500,
        sale_price: 1999,
        sku: 'ELEC-001',
        stock: 50,
        category_id: electronicsId,
        is_featured: true,
        is_new_arrival: true,
      },
      {
        name: 'Smart Watch Pro',
        slug: 'smart-watch-pro',
        price: 5000,
        sale_price: 3999,
        sku: 'ELEC-002',
        stock: 30,
        category_id: electronicsId,
        is_featured: true,
        is_new_arrival: false,
      },
    ];

    for (const product of sampleProducts) {
      await client.query(`
        INSERT INTO products 
        (name, slug, price, sale_price, sku, stock, category_id, is_active, is_featured, is_new_arrival, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10)
        ON CONFLICT (slug) DO NOTHING
      `, [
        product.name, product.slug, product.price, product.sale_price,
        product.sku, product.stock, product.category_id,
        product.is_featured, product.is_new_arrival,
        `High quality ${product.name} available at Nijer Bazaar.`
      ]);
    }
    console.log('✅ Sample products created');

    // ============================
    // 5. Default Settings
    // ============================
    const defaultSettings = [
      { key: 'store_name', value: 'Nijer Bazaar', type: 'string', group: 'general' },
      { key: 'store_email', value: 'info@nijerbazaar.com', type: 'string', group: 'general' },
      { key: 'store_phone', value: '01700000000', type: 'string', group: 'general' },
      { key: 'store_address', value: 'Dhaka, Bangladesh', type: 'string', group: 'general' },
      { key: 'currency', value: 'BDT', type: 'string', group: 'general' },
      { key: 'inside_dhaka_shipping', value: '60', type: 'number', group: 'shipping' },
      { key: 'outside_dhaka_shipping', value: '120', type: 'number', group: 'shipping' },
      { key: 'vat_percentage', value: '0', type: 'number', group: 'general' },
      { key: 'loyalty_point_per_taka', value: '1', type: 'number', group: 'general' },
      { key: 'loyalty_taka_per_point', value: '0.1', type: 'number', group: 'general' },
    ];

    for (const setting of defaultSettings) {
      await client.query(`
        INSERT INTO settings (key, value, type, "group")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO NOTHING
      `, [setting.key, setting.value, setting.type, setting.group]);
    }
    console.log('✅ Default settings created');

    // ============================
    // 6. Create Default Warehouse
    // ============================
    await client.query(`
      INSERT INTO warehouses (name, address, city, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT DO NOTHING
    `, ['Main Warehouse', 'Mirpur, Dhaka', 'Dhaka']);
    console.log('✅ Default warehouse created');

    console.log('');
    console.log('🎉 ================================');
    console.log('   DATABASE SEED COMPLETE!');
    console.log('🎉 ================================');
    console.log('');
    console.log('📧 Admin Login:');
    console.log('   Email:    admin@nijerbazaar.com');
    console.log('   Password: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ Seed Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);