import bcrypt from 'bcryptjs';
import { db, pool } from './config/db';
import {
  admins, categories, products, productImages, productVariants,
  warehouses, inventory, couriers, shippingZones, coupons,
  expenseCategories, settings, notificationTemplates,
} from './schemas';

async function seed() {
  console.log('🌱 Seeding Nijer Bazaar database...\n');

  // ---------- 1. Super Admin ----------
  const adminPassword = await bcrypt.hash('admin123', 10);
  await db.insert(admins).values([
    { name: 'Super Admin', email: 'admin@nijerbazaar.com', phone: '01700000000', password: adminPassword, role: 'super_admin' },
    { name: 'Store Manager', email: 'manager@nijerbazaar.com', phone: '01700000001', password: adminPassword, role: 'manager' },
    { name: 'Warehouse Staff', email: 'warehouse@nijerbazaar.com', phone: '01700000002', password: adminPassword, role: 'warehouse_staff' },
  ]).onConflictDoNothing();
  console.log('✅ Admins created (password: admin123)');

  // ---------- 2. Warehouse ----------
  const [mainWarehouse] = await db.insert(warehouses).values({
    name: 'Dhaka Main Warehouse', code: 'DHK-01', city: 'Dhaka',
    address: 'Mirpur-10, Dhaka-1216', phone: '01700000000', isDefault: true,
  }).onConflictDoNothing().returning();
  console.log('✅ Warehouse created');

  // ---------- 3. Categories ----------
  const categoryData = [
    { name: 'Electronics', nameBn: 'ইলেকট্রনিক্স', slug: 'electronics', icon: 'Smartphone', isFeatured: true, image: 'https://picsum.photos/seed/electronics/400/400' },
    { name: 'Fashion', nameBn: 'ফ্যাশন', slug: 'fashion', icon: 'Shirt', isFeatured: true, image: 'https://picsum.photos/seed/fashion/400/400' },
    { name: 'Home & Kitchen', nameBn: 'হোম ও কিচেন', slug: 'home-kitchen', icon: 'Home', isFeatured: true, image: 'https://picsum.photos/seed/kitchen/400/400' },
    { name: 'Beauty & Health', nameBn: 'বিউটি ও হেলথ', slug: 'beauty-health', icon: 'Sparkles', isFeatured: true, image: 'https://picsum.photos/seed/beauty/400/400' },
    { name: 'Groceries', nameBn: 'মুদি', slug: 'groceries', icon: 'ShoppingBasket', isFeatured: true, image: 'https://picsum.photos/seed/grocery/400/400' },
    { name: 'Sports & Outdoor', nameBn: 'স্পোর্টস', slug: 'sports-outdoor', icon: 'Dumbbell', isFeatured: true, image: 'https://picsum.photos/seed/sports/400/400' },
    { name: 'Books & Stationery', nameBn: 'বই ও স্টেশনারি', slug: 'books-stationery', icon: 'BookOpen', image: 'https://picsum.photos/seed/books/400/400' },
    { name: 'Baby & Kids', nameBn: 'বেবি ও কিডস', slug: 'baby-kids', icon: 'Baby', image: 'https://picsum.photos/seed/baby/400/400' },
  ];
  const insertedCategories = await db.insert(categories).values(categoryData).onConflictDoNothing().returning();
  const catId = (slug: string) => insertedCategories.find(c => c.slug === slug)?.id ?? null;
  console.log(`✅ ${insertedCategories.length} categories created`);

  // ---------- 4. Products ----------
  const productData = [
    { name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones', sku: 'NB-ELC-001', categoryId: catId('electronics'), brand: 'SoundMax', price: 2500, salePrice: 1999, costPrice: 1400, stock: 50, isFeatured: true, isFlashSale: true, shortDescription: 'Premium sound, 30h battery life, noise cancellation.', description: 'Experience premium audio with deep bass and crystal-clear highs. 30-hour battery, Bluetooth 5.3, foldable design.', tags: ['headphone', 'bluetooth', 'audio'], specifications: { Battery: '30 hours', Bluetooth: '5.3', Weight: '250g' } },
    { name: 'Smart Watch Pro', slug: 'smart-watch-pro', sku: 'NB-ELC-002', categoryId: catId('electronics'), brand: 'FitTech', price: 4500, salePrice: 3799, costPrice: 2800, stock: 30, isFeatured: true, isNewArrival: true, shortDescription: 'Heart rate, SpO2, 1.8" AMOLED display.', description: 'Track your health with precision. Waterproof IP68, 7-day battery life, 100+ sport modes.', tags: ['watch', 'smart', 'fitness'], specifications: { Display: '1.8" AMOLED', Battery: '7 days', Waterproof: 'IP68' } },
    { name: 'Men\'s Premium Cotton Panjabi', slug: 'mens-premium-cotton-panjabi', sku: 'NB-FSH-001', categoryId: catId('fashion'), brand: 'Aarong Style', price: 1800, salePrice: 1500, costPrice: 900, stock: 80, isFeatured: true, shortDescription: '100% cotton, comfortable fit, perfect for Eid.', description: 'Elegant hand-finished panjabi in breathable cotton. Available in multiple sizes and colors.', tags: ['panjabi', 'men', 'eid'], specifications: { Fabric: '100% Cotton', Fit: 'Regular', Care: 'Machine wash' } },
    { name: 'Women\'s Jamdani Saree', slug: 'womens-jamdani-saree', sku: 'NB-FSH-002', categoryId: catId('fashion'), brand: 'Tangail Weavers', price: 5500, salePrice: 4800, costPrice: 3200, stock: 25, isFeatured: true, isNewArrival: true, shortDescription: 'Authentic handloom Jamdani from Narayanganj.', description: 'Traditional Jamdani saree with intricate motifs, hand-woven by master artisans.', tags: ['saree', 'jamdani', 'women'], specifications: { Fabric: 'Cotton-Silk', Length: '5.5 m', Origin: 'Narayanganj' } },
    { name: 'Non-Stick Cookware Set (5 pcs)', slug: 'non-stick-cookware-set', sku: 'NB-HMK-001', categoryId: catId('home-kitchen'), brand: 'KitchenPro', price: 3200, salePrice: 2750, costPrice: 1900, stock: 40, isFeatured: true, shortDescription: 'Durable non-stick coating, induction compatible.', description: 'Complete 5-piece set: frying pan, saucepan, kadai, tawa and lids. Scratch-resistant, PFOA-free.', tags: ['cookware', 'kitchen'], specifications: { Pieces: '5', Material: 'Aluminium', Induction: 'Yes' } },
    { name: 'Himalaya Neem Face Wash 150ml', slug: 'himalaya-neem-face-wash', sku: 'NB-BTY-001', categoryId: catId('beauty-health'), brand: 'Himalaya', price: 350, salePrice: 299, costPrice: 220, stock: 200, shortDescription: 'Purifying neem face wash for oily skin.', description: 'Soap-free herbal formulation that cleans impurities and helps clear pimples.', tags: ['facewash', 'skincare'], specifications: { Volume: '150 ml', Type: 'Herbal' } },
    { name: 'Premium Miniket Rice 25kg', slug: 'premium-miniket-rice-25kg', sku: 'NB-GRC-001', categoryId: catId('groceries'), brand: 'Fresh', price: 1950, costPrice: 1700, stock: 100, shortDescription: 'Fresh, aromatic premium miniket rice.', description: 'Carefully sorted and packed premium miniket rice from Dinajpur.', tags: ['rice', 'grocery'], specifications: { Weight: '25 kg', Origin: 'Dinajpur' } },
    { name: 'Yoga Mat 6mm Anti-Slip', slug: 'yoga-mat-6mm', sku: 'NB-SPT-001', categoryId: catId('sports-outdoor'), brand: 'FlexFit', price: 1200, salePrice: 950, costPrice: 600, stock: 60, isNewArrival: true, shortDescription: 'Extra-thick, eco-friendly TPE yoga mat.', description: 'Double-sided anti-slip texture, lightweight with carrying strap. 183cm × 61cm.', tags: ['yoga', 'fitness'], specifications: { Thickness: '6 mm', Size: '183×61 cm', Material: 'TPE' } },
    { name: 'Classic Notebook Set (3 pcs)', slug: 'classic-notebook-set', sku: 'NB-BKS-001', categoryId: catId('books-stationery'), brand: 'Paperly', price: 450, salePrice: 380, costPrice: 220, stock: 150, shortDescription: 'A5 ruled notebooks, 200 pages each.', description: 'Hard-cover, 80 GSM paper, ribbon bookmark. Pack of 3 colors.', tags: ['notebook', 'stationery'], specifications: { Size: 'A5', Pages: '200', Pack: '3' } },
    { name: 'Baby Diaper Pants Size L (44 pcs)', slug: 'baby-diaper-pants-l', sku: 'NB-BBY-001', categoryId: catId('baby-kids'), brand: 'SoftCare', price: 1150, salePrice: 999, costPrice: 820, stock: 90, isFlashSale: true, shortDescription: '12-hour absorption, ultra-soft.', description: 'Breathable, leak-proof pant-style diapers with wetness indicator.', tags: ['diaper', 'baby'], specifications: { Size: 'L (9-14 kg)', Count: '44' } },
    { name: '4K Android Smart TV 43"', slug: '4k-android-smart-tv-43', sku: 'NB-ELC-003', categoryId: catId('electronics'), brand: 'VisionX', price: 38000, salePrice: 34500, costPrice: 29000, stock: 12, isFeatured: true, shortDescription: 'Ultra HD, Android 11, voice remote.', description: 'Stunning 4K HDR picture, Dolby Audio, built-in Chromecast, Netflix & YouTube.', tags: ['tv', 'smart', '4k'], specifications: { Size: '43 inch', Resolution: '3840×2160', OS: 'Android 11' } },
    { name: 'Leather Formal Shoes', slug: 'leather-formal-shoes', sku: 'NB-FSH-003', categoryId: catId('fashion'), brand: 'Bata Style', price: 3500, salePrice: 2999, costPrice: 1800, stock: 45, shortDescription: 'Genuine leather, cushioned insole.', description: 'Handcrafted genuine leather oxford shoes, perfect for office and formal events.', tags: ['shoes', 'men', 'formal'], specifications: { Material: 'Genuine Leather', Sole: 'Rubber' } },
  ];
  const insertedProducts = await db.insert(products).values(productData).onConflictDoNothing().returning();
  console.log(`✅ ${insertedProducts.length} products created`);

  // ---------- 5. Product Images + Inventory ----------
  for (const p of insertedProducts) {
    await db.insert(productImages).values([
      { productId: p.id, imageUrl: `https://picsum.photos/seed/${p.slug}-1/600/600`, isMain: true, sortOrder: 0, altText: p.name },
      { productId: p.id, imageUrl: `https://picsum.photos/seed/${p.slug}-2/600/600`, isMain: false, sortOrder: 1, altText: p.name },
      { productId: p.id, imageUrl: `https://picsum.photos/seed/${p.slug}-3/600/600`, isMain: false, sortOrder: 2, altText: p.name },
    ]);
    if (mainWarehouse) {
      await db.insert(inventory).values({ productId: p.id, warehouseId: mainWarehouse.id, quantity: p.stock, shelfLocation: 'A-01' }).onConflictDoNothing();
    }
  }
  console.log('✅ Product images & inventory created');

  // ---------- 6. Variants for fashion items ----------
  const panjabi = insertedProducts.find(p => p.sku === 'NB-FSH-001');
  const shoes = insertedProducts.find(p => p.sku === 'NB-FSH-003');
  if (panjabi) {
    await db.insert(productVariants).values([
      { productId: panjabi.id, name: 'Size', value: 'M', stock: 20 },
      { productId: panjabi.id, name: 'Size', value: 'L', stock: 30 },
      { productId: panjabi.id, name: 'Size', value: 'XL', stock: 30 },
      { productId: panjabi.id, name: 'Color', value: 'White', stock: 40 },
      { productId: panjabi.id, name: 'Color', value: 'Navy Blue', stock: 40 },
    ]);
  }
  if (shoes) {
    await db.insert(productVariants).values([
      { productId: shoes.id, name: 'Size', value: '40', stock: 10 },
      { productId: shoes.id, name: 'Size', value: '41', stock: 15 },
      { productId: shoes.id, name: 'Size', value: '42', stock: 20 },
    ]);
  }
  console.log('✅ Product variants created');

  // ---------- 7. Couriers ----------
  await db.insert(couriers).values([
    { name: 'Pathao Courier', code: 'pathao', contactPhone: '09678100800', insideDhakaCharge: 60, outsideDhakaCharge: 120, isDefault: true, trackingUrl: 'https://merchant.pathao.com/tracking?consignment_id={tracking}' },
    { name: 'Steadfast Courier', code: 'steadfast', contactPhone: '09638000000', insideDhakaCharge: 60, outsideDhakaCharge: 110, trackingUrl: 'https://steadfast.com.bd/t/{tracking}' },
    { name: 'RedX', code: 'redx', contactPhone: '09610007339', insideDhakaCharge: 60, outsideDhakaCharge: 130, trackingUrl: 'https://redx.com.bd/track-parcel/?trackingId={tracking}' },
    { name: 'Sundarban Courier', code: 'sundarban', contactPhone: '02-9563000', insideDhakaCharge: 70, outsideDhakaCharge: 100 },
    { name: 'Paperfly', code: 'paperfly', contactPhone: '09678300300', insideDhakaCharge: 60, outsideDhakaCharge: 120 },
  ]).onConflictDoNothing();
  console.log('✅ Couriers created');

  // ---------- 8. Shipping Zones ----------
  await db.insert(shippingZones).values([
    { name: 'Inside Dhaka', districts: ['Dhaka'], charge: 60, freeShippingAbove: 2000, estimatedDays: '1-2 days' },
    { name: 'Dhaka Suburb', districts: ['Gazipur', 'Narayanganj', 'Savar', 'Keraniganj'], charge: 90, freeShippingAbove: 3000, estimatedDays: '2-3 days' },
    { name: 'Outside Dhaka', districts: ['*'], charge: 120, freeShippingAbove: 5000, estimatedDays: '3-5 days' },
  ]);
  console.log('✅ Shipping zones created');

  // ---------- 9. Coupons ----------
  await db.insert(coupons).values([
    { code: 'WELCOME10', description: '10% off on first order', type: 'percentage', value: 10, maxDiscount: 500, minOrderAmount: 500, maxUsesPerUser: 1 },
    { code: 'FLAT100', description: '৳100 off on orders above ৳1000', type: 'flat', value: 100, minOrderAmount: 1000, maxUses: 1000 },
    { code: 'FREESHIP', description: 'Free shipping on orders above ৳1500', type: 'free_shipping', value: 0, minOrderAmount: 1500 },
  ]).onConflictDoNothing();
  console.log('✅ Coupons created');

  // ---------- 10. Expense Categories ----------
  await db.insert(expenseCategories).values([
    { name: 'Rent' }, { name: 'Salary' }, { name: 'Marketing' }, { name: 'Utilities' },
    { name: 'Packaging' }, { name: 'Courier Charges' }, { name: 'Product Purchase' }, { name: 'Other' },
  ]).onConflictDoNothing();
  console.log('✅ Expense categories created');

  // ---------- 11. Settings ----------
  await db.insert(settings).values([
    { key: 'store_name', value: 'Nijer Bazaar', group: 'general', label: 'Store Name' },
    { key: 'store_name_bn', value: 'নিজের বাজার', group: 'general', label: 'Store Name (Bangla)' },
    { key: 'store_email', value: 'support@nijerbazaar.com', group: 'general', label: 'Store Email' },
    { key: 'store_phone', value: '+880 1700-000000', group: 'general', label: 'Store Phone' },
    { key: 'store_address', value: 'Mirpur-10, Dhaka-1216, Bangladesh', group: 'general', label: 'Store Address' },
    { key: 'store_logo', value: '', group: 'general', label: 'Logo URL' },
    { key: 'currency_symbol', value: '৳', group: 'general', label: 'Currency Symbol' },
    { key: 'bkash_number', value: '01700000000', group: 'payment', label: 'bKash Merchant Number' },
    { key: 'nagad_number', value: '01700000000', group: 'payment', label: 'Nagad Merchant Number' },
    { key: 'cod_enabled', value: 'true', group: 'payment', label: 'Cash on Delivery Enabled' },
    { key: 'vat_percent', value: '0', group: 'tax', label: 'VAT %' },
    { key: 'loyalty_points_per_100_taka', value: '1', group: 'loyalty', label: 'Points earned per ৳100' },
    { key: 'loyalty_point_value', value: '1', group: 'loyalty', label: '৳ value per point' },
    { key: 'low_stock_threshold', value: '5', group: 'inventory', label: 'Default low stock threshold' },
    { key: 'meta_title', value: 'Nijer Bazaar — Online Shopping in Bangladesh', group: 'seo', label: 'Meta Title' },
    { key: 'meta_description', value: 'Shop electronics, fashion, groceries and more at the best prices in Bangladesh.', group: 'seo', label: 'Meta Description' },
    { key: 'facebook_url', value: 'https://facebook.com/nijerbazaar', group: 'social', label: 'Facebook' },
    { key: 'whatsapp_number', value: '8801700000000', group: 'social', label: 'WhatsApp' },
    { key: 'maintenance_mode', value: 'false', group: 'general', label: 'Maintenance Mode' },
  ]).onConflictDoNothing();
  console.log('✅ Settings created');

  // ---------- 12. Notification Templates ----------
  await db.insert(notificationTemplates).values([
    { event: 'order_placed', channel: 'sms', body: 'Dear {{customer_name}}, your order {{order_number}} of ৳{{total}} has been placed. - Nijer Bazaar' },
    { event: 'order_confirmed', channel: 'sms', body: 'Your order {{order_number}} is confirmed and being prepared. - Nijer Bazaar' },
    { event: 'order_shipped', channel: 'sms', body: 'Order {{order_number}} has been shipped via {{courier}}. Tracking: {{tracking}} - Nijer Bazaar' },
    { event: 'order_delivered', channel: 'sms', body: 'Order {{order_number}} delivered. Thank you for shopping with Nijer Bazaar!' },
    { event: 'order_placed', channel: 'email', subject: 'Order Confirmation - {{order_number}}', body: '<h2>Thank you, {{customer_name}}!</h2><p>Your order <b>{{order_number}}</b> totaling <b>৳{{total}}</b> has been received.</p>' },
    { event: 'order_shipped', channel: 'email', subject: 'Your order {{order_number}} is on the way', body: '<p>Hi {{customer_name}}, your order has been shipped via {{courier}}. Tracking number: <b>{{tracking}}</b></p>' },
  ]);
  console.log('✅ Notification templates created');

  console.log('\n🎉 Seeding complete!');
  console.log('👉 Admin login: admin@nijerbazaar.com / admin123\n');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });