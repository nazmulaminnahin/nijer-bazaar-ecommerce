import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import { testConnection } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

// Import routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import categoryRoutes from "./routes/category.routes";
import customerRoutes from "./routes/customer.routes";
import reportRoutes from "./routes/report.routes";
import adminExtrasRoutes from "./routes/adminExtras.routes";

const app = express();

// ============================
// MIDDLEWARE
// ============================
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ============================
// HEALTH CHECK
// ============================
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "🛒 Nijer Bazaar API is Running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ============================
// API ROUTES
// ============================
// Mount comprehensive Admin & Coupon routes first
app.use("/api", adminExtrasRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/customers", customerRoutes);
app.use("/api/admin/reports", reportRoutes);

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
// START SERVER WITH DB CHECK
// ============================
async function startServer() {
  try {
    await testConnection();

    app.listen(parseInt(env.PORT), "0.0.0.0", () => {
      console.log("");
      console.log("🛒 ================================");
      console.log("   NIJER BAZAAR SERVER STARTED");
      console.log("🛒 ================================");
      console.log(`🌍 Server:  http://localhost:${env.PORT}`);
      console.log(`🌍 API:     http://localhost:${env.PORT}/api`);
      console.log(`📦 Mode:    ${env.NODE_ENV}`);
      console.log("🛒 ================================");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;