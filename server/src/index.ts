import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import couriersRoutes from "./routes/couriers.routes";
import loyaltyRoutes from "./routes/loyalty.routes";
import giftCardRoutes from "./routes/giftcard.routes";
import staffRoutes from "./routes/staff.routes";
import notificationRoutes from "./routes/notification.routes";
import accountingRoutes from "./routes/accounting.routes";
// Import all routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';
import customerRoutes from './routes/customer.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();

// ============================
// MIDDLEWARE
// ============================
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================
// HEALTH CHECK
// ============================
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🛒 Nijer Bazaar API is Running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================
// API ROUTES
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use("/api/couriers", couriersRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/gift-cards", giftCardRoutes);
app.use("/api/admin/staff", staffRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/accounting", accountingRoutes);
import inventoryRoutes from "./routes/inventory.routes";
// ...
app.use("/api/admin/inventory", inventoryRoutes);
// ============================
// 404 HANDLER
// ============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ============================
// GLOBAL ERROR HANDLER
// ============================
app.use(errorHandler);

// ============================
// START SERVER
// ============================
app.listen(parseInt(env.PORT), () => {
  console.log('');
  console.log('🛒 ================================');
  console.log('   NIJER BAZAAR SERVER STARTED');
  console.log('🛒 ================================');
  console.log(`🌍 Server:  http://localhost:${env.PORT}`);
  console.log(`🌍 API:     http://localhost:${env.PORT}/api`);
  console.log(`📦 Mode:    ${env.NODE_ENV}`);
  console.log('');
  console.log('📌 Available Routes:');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/admin/login');
  console.log('   GET  /api/products');
  console.log('   GET  /api/categories');
  console.log('   GET  /api/orders/track');
  console.log('   GET  /api/admin/dashboard');
  console.log('🛒 ================================');
  console.log('');
});

export default app;