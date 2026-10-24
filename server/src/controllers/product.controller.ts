import { Request, Response, NextFunction } from 'express';
import { eq, like, and, desc, asc, sql, gte, lte, or } from 'drizzle-orm';
import { db } from '../config/db';
import { products, productImages, productVariants, categories } from '../schemas/index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AdminRequest } from '../middleware/adminAuth';

// GET /api/products — Public product listing
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '12',
    category,
    search,
    sort = 'newest',
    minPrice,
    maxPrice,
    featured,
    newArrival,
    flashSale,
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Build conditions
  const conditions = [eq(products.isActive, true)];

  if (category) {
    const [cat] = await db.select().from(categories)
      .where(eq(categories.slug, category as string));
    if (cat) conditions.push(eq(products.categoryId, cat.id));
  }

  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.sku, `%${search}%`)
      )!
    );
  }

  if (minPrice) conditions.push(gte(products.price, minPrice as string));
  if (maxPrice) conditions.push(lte(products.price, maxPrice as string));
  if (featured === 'true') conditions.push(eq(products.isFeatured, true));
  if (newArrival === 'true') conditions.push(eq(products.isNewArrival, true));
  if (flashSale === 'true') conditions.push(eq(products.isFlashSale, true));

  // Sort
  let orderBy;
  switch (sort) {
    case 'price_asc': orderBy = asc(products.price); break;
    case 'price_desc': orderBy = desc(products.price); break;
    case 'best_selling': orderBy = desc(products.totalSold); break;
    case 'rating': orderBy = desc(products.rating); break;
    default: orderBy = desc(products.createdAt);
  }

  const [allProducts, totalCount] = await Promise.all([
    db.select().from(products)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products)
      .where(and(...conditions)),
  ]);

  // Get images for each product
  const productIds = allProducts.map(p => p.id);
  const images = productIds.length > 0
    ? await db.select().from(productImages)
        .where(eq(productImages.isMain, true))
    : [];

  const productsWithImages = allProducts.map(product => ({
    ...product,
    mainImage: images.find(img => img.productId === product.id)?.imageUrl || null,
  }));

  const total = Number(totalCount[0]?.count || 0);

  return res.json({
    success: true,
    data: productsWithImages,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// GET /api/products/:id — Single product detail
export const getProductById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const [product] = await db.select().from(products)
    .where(and(eq(products.id, parseInt(id)), eq(products.isActive, true)));

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const [images, variants, category] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder)),
    db.select().from(productVariants).where(eq(productVariants.productId, product.id)),
    product.categoryId
      ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
      : Promise.resolve([]),
  ]);

  return res.json({
    success: true,
    data: {
      ...product,
      images,
      variants,
      category: category[0] || null,
    },
  });
});

// ============================
// ADMIN PRODUCT CONTROLLERS
// ============================

// GET /api/admin/products
export const adminGetProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, category, status } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (search) conditions.push(or(like(products.name, `%${search}%`), like(products.sku, `%${search}%`))!);
  if (status === 'active') conditions.push(eq(products.isActive, true));
  if (status === 'inactive') conditions.push(eq(products.isActive, false));

  const [allProducts, totalCount] = await Promise.all([
    db.select().from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const images = await db.select().from(productImages).where(eq(productImages.isMain, true));

  const productsWithImages = allProducts.map(product => ({
    ...product,
    mainImage: images.find(img => img.productId === product.id)?.imageUrl || null,
  }));

  return res.json({
    success: true,
    data: productsWithImages,
    total: Number(totalCount[0]?.count || 0),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limitNum),
  });
});

// POST /api/admin/products
export const adminCreateProduct = asyncHandler(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const {
    name, description, shortDescription, categoryId,
    price, salePrice, sku, stock, lowStockThreshold,
    weight, tags, isActive, isFeatured, isNewArrival,
    isFlashSale, flashSaleEndTime
  } = req.body;

  if (!name || !price || !sku) {
    return next(new AppError('Name, price, and SKU are required', 400));
  }

  // Generate slug
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    + '-' + Date.now();

  // Check SKU uniqueness
  const existingSku = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  if (existingSku.length > 0) {
    return next(new AppError('SKU already exists', 409));
  }

  const [newProduct] = await db.insert(products).values({
    name,
    slug,
    description,
    shortDescription,
    categoryId: categoryId ? parseInt(categoryId) : null,
    price: price.toString(),
    salePrice: salePrice ? salePrice.toString() : null,
    sku,
    stock: parseInt(stock) || 0,
    lowStockThreshold: parseInt(lowStockThreshold) || 10,
    weight: weight ? weight.toString() : null,
    tags: tags || [],
    isActive: isActive !== undefined ? isActive : true,
    isFeatured: isFeatured || false,
    isNewArrival: isNewArrival || false,
    isFlashSale: isFlashSale || false,
    flashSaleEndTime: flashSaleEndTime ? new Date(flashSaleEndTime) : null,
  }).returning();

  // Handle uploaded images
  if (req.files && Array.isArray(req.files)) {
    for (let i = 0; i < req.files.length; i++) {
      await db.insert(productImages).values({
        productId: newProduct.id,
        imageUrl: `/uploads/products/${req.files[i].filename}`,
        isMain: i === 0,
        sortOrder: i,
      });
    }
  }

  return res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: newProduct,
  });
});

// PUT /api/admin/products/:id
export const adminUpdateProduct = asyncHandler(async (req: AdminRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const [existing] = await db.select().from(products).where(eq(products.id, parseInt(id)));
  if (!existing) {
    return next(new AppError('Product not found', 404));
  }

  const updateData: Partial<typeof existing> = {};
  const fields = ['name', 'description', 'shortDescription', 'categoryId', 'price',
    'salePrice', 'sku', 'stock', 'lowStockThreshold', 'weight', 'tags',
    'isActive', 'isFeatured', 'isNewArrival', 'isFlashSale'];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      (updateData as Record<string, unknown>)[field] = req.body[field];
    }
  }
  updateData.updatedAt = new Date();

  const [updated] = await db.update(products)
    .set(updateData)
    .where(eq(products.id, parseInt(id)))
    .returning();

  return res.json({
    success: true,
    message: 'Product updated successfully',
    data: updated,
  });
});

// DELETE /api/admin/products/:id
export const adminDeleteProduct = asyncHandler(async (_req: AdminRequest, res: Response, next: NextFunction) => {
  const id = parseInt(_req.params.id);
  const [existing] = await db.select().from(products).where(eq(products.id, id));

  if (!existing) {
    return next(new AppError('Product not found', 404));
  }

  // Soft delete — just deactivate
  await db.update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id));

  return res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});