import { and, eq, isNull, sql, inArray, count } from 'drizzle-orm';
import { db } from '../config/db';
import type { DbClient } from '../config/db';
import {
  orders, orderItems, products, productVariants, inventory, inventoryLogs, warehouses,
  coupons, couponUsages, users, cart, shippingZones, settings, loyaltyTransactions,
  transactions, couriers, shipments, staffLogs, addresses,
  type NewOrder, type OrderItem,
} from '../schemas';
import { ApiError } from '../utils/ApiError';
import { generateOrderNumber, toDateString } from '../utils/helpers';
import { notifyOrderEvent } from './notification.service';
import type { CreateOrderInput, AssignCourierInput } from '../validators';
import type { OrderStatus } from '../types';

const ORDER_WITH = {
  items: true,
  courier: true,
  shipments: true,
  user: { columns: { id: true, name: true, email: true, phone: true } },
} as const;

// ---------------- Shipping ----------------
export async function calculateShipping(dbc: DbClient, district: string, subtotal: number) {
  const zones = await dbc.query.shippingZones.findMany({ where: eq(shippingZones.isActive, true) });
  const d = district.trim().toLowerCase();
  let zone = zones.find((z) => z.districts.some((x) => x.toLowerCase() === d));
  if (!zone) zone = zones.find((z) => z.districts.includes('*'));
  if (!zone) return { charge: 120, zone: null };
  const charge = zone.freeShippingAbove && subtotal >= zone.freeShippingAbove ? 0 : zone.charge;
  return { charge, zone };
}

// ---------------- Coupon ----------------
export async function validateCoupon(dbc: DbClient, code: string, subtotal: number, userId: number | null) {
  const coupon = await dbc.query.coupons.findFirst({ where: eq(coupons.code, code.toUpperCase()) });
  if (!coupon || !coupon.isActive) throw new ApiError(400, 'Invalid coupon code');

  const now = new Date();
  if (coupon.startsAt > now) throw new ApiError(400, 'Coupon is not active yet');
  if (coupon.expiresAt && coupon.expiresAt < now) throw new ApiError(400, 'Coupon has expired');
  if (subtotal < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount for this coupon is ৳${coupon.minOrderAmount}`);
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new ApiError(400, 'Coupon usage limit reached');

  if (userId) {
    const [{ c }] = await dbc
      .select({ c: count() })
      .from(couponUsages)
      .where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, userId)));
    if (c >= coupon.maxUsesPerUser) throw new ApiError(400, 'You have already used this coupon');
  }

  let discount = 0;
  if (coupon.type === 'flat') discount = coupon.value;
  else if (coupon.type === 'percentage') {
    discount = Math.floor((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  }
  return { coupon, discount: Math.min(discount, subtotal) };
}

// ---------------- Create order ----------------
export async function createOrder(input: CreateOrderInput, userId: number | null) {
  const order = await db.transaction(async (tx) => {
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const dbProducts = await tx.query.products.findMany({
      where: inArray(products.id, productIds),
      with: { images: true, variants: true },
    });

    let subtotal = 0;
    const itemRows: Array<Omit<typeof orderItems.$inferInsert, 'orderId'>> = [];

    for (const item of input.items) {
      const p = dbProducts.find((x) => x.id === item.productId);
      if (!p || !p.isActive) throw new ApiError(400, `Product #${item.productId} is not available`);
      if (p.stock < item.quantity) throw new ApiError(400, `Insufficient stock for "${p.name}" (available: ${p.stock})`);

      let unitPrice = p.salePrice ?? p.price;
      let variantLabel: string | null = null;
      if (item.variantId) {
        const v = p.variants.find((x) => x.id === item.variantId && x.isActive);
        if (!v) throw new ApiError(400, `Invalid variant for "${p.name}"`);
        if (v.stock < item.quantity) throw new ApiError(400, `Insufficient stock for "${p.name}" (${v.name}: ${v.value})`);
        unitPrice += v.priceAdjustment;
        variantLabel = `${v.name}: ${v.value}`;
      }

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      itemRows.push({
        productId: p.id,
        variantId: item.variantId ?? null,
        productName: p.name,
        productSku: p.sku,
        productImage: p.images.find((i) => i.isMain)?.imageUrl ?? p.images[0]?.imageUrl ?? null,
        variantLabel,
        quantity: item.quantity,
        unitPrice,
        costPrice: p.costPrice ?? 0,
        totalPrice,
      });
    }

    // Shipping & coupon
    const { charge } = await calculateShipping(tx, input.shippingAddress.district, subtotal);
    let shippingCost = charge;
    let discount = 0;
    let coupon: typeof coupons.$inferSelect | null = null;

    if (input.couponCode) {
      const r = await validateCoupon(tx, input.couponCode, subtotal, userId);
      coupon = r.coupon;
      if (coupon.type === 'free_shipping') shippingCost = 0;
      else discount = r.discount;
    }

    const total = Math.max(0, subtotal + shippingCost - discount);
    const orderNumber = await generateOrderNumber(tx);

    const [created] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId,
        customerName: input.shippingAddress.name,
        customerPhone: input.shippingAddress.phone,
        customerEmail: input.customerEmail ?? null,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'pending',
        transactionId: input.transactionId ?? null,
        subtotal,
        shippingCost,
        discount,
        total,
        couponCode: coupon?.code ?? null,
        customerNote: input.customerNote ?? null,
        source: 'website',
      })
      .returning();

    await tx.insert(orderItems).values(itemRows.map((r) => ({ ...r, orderId: created.id })));

    // Deduct stock
    const wh = await tx.query.warehouses.findFirst({ where: eq(warehouses.isDefault, true) });
    for (const r of itemRows) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${r.quantity}`, soldCount: sql`${products.soldCount} + ${r.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, r.productId!));
      if (r.variantId) {
        await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${r.quantity}` }).where(eq(productVariants.id, r.variantId));
      }
      if (wh) {
        await tx
          .update(inventory)
          .set({ quantity: sql`${inventory.quantity} - ${r.quantity}`, updatedAt: new Date() })
          .where(and(eq(inventory.productId, r.productId!), eq(inventory.warehouseId, wh.id), isNull(inventory.variantId)));
      }
      const [p] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, r.productId!));
      await tx.insert(inventoryLogs).values({
        productId: r.productId!,
        variantId: r.variantId ?? null,
        warehouseId: wh?.id ?? null,
        type: 'sale',
        quantityChange: -r.quantity,
        quantityAfter: p?.stock ?? 0,
        referenceId: created.id,
        note: `Order ${orderNumber}`,
      });
    }

    if (coupon) {
      await tx.insert(couponUsages).values({ couponId: coupon.id, userId, orderId: created.id, discountAmount: discount });
      await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, coupon.id));
    }

    if (userId) {
      await tx.update(users).set({ totalOrders: sql`${users.totalOrders} + 1`, updatedAt: new Date() }).where(eq(users.id, userId));
      await tx.delete(cart).where(eq(cart.userId, userId));
      if (input.saveAddress) {
        await tx.insert(addresses).values({ userId, ...input.shippingAddress, label: 'Home' });
      }
    }

    return created;
  });

  const full = await db.query.orders.findFirst({ where: eq(orders.id, order.id), with: ORDER_WITH });
  notifyOrderEvent('order_placed', order).catch(() => {});
  return full!;
}

// ---------------- Restore stock (cancel / return) ----------------
async function restoreStock(
  tx: DbClient,
  order: { id: number; orderNumber: string; items: OrderItem[] },
  reason: string,
  adminId: number | null
) {
  const wh = await tx.query.warehouses.findFirst({ where: eq(warehouses.isDefault, true) });
  for (const it of order.items) {
    if (!it.productId) continue;
    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${it.quantity}`,
        soldCount: sql`greatest(${products.soldCount} - ${it.quantity}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, it.productId));
    if (it.variantId) {
      await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${it.quantity}` }).where(eq(productVariants.id, it.variantId));
    }
    if (wh) {
      await tx
        .update(inventory)
        .set({ quantity: sql`${inventory.quantity} + ${it.quantity}`, updatedAt: new Date() })
        .where(and(eq(inventory.productId, it.productId), eq(inventory.warehouseId, wh.id), isNull(inventory.variantId)));
    }
    const [p] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, it.productId));
    await tx.insert(inventoryLogs).values({
      productId: it.productId,
      variantId: it.variantId,
      warehouseId: wh?.id ?? null,
      type: 'return',
      quantityChange: it.quantity,
      quantityAfter: p?.stock ?? 0,
      referenceId: order.id,
      note: `Order ${order.orderNumber} ${reason}`,
      adminId,
    });
  }
}

// ---------------- Update status ----------------
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  opts: { adminId?: number | null; note?: string; byCustomer?: boolean } = {}
) {
  const updated = await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status === status) throw new ApiError(400, `Order is already ${status}`);
    if (opts.byCustomer && order.status !== 'pending') throw new ApiError(400, 'Only pending orders can be cancelled');
    if (order.status === 'cancelled' || order.status === 'returned') throw new ApiError(400, `Order is ${order.status} and cannot be changed`);
    if (order.status === 'delivered' && status !== 'returned') throw new ApiError(400, 'A delivered order can only be marked as returned');

    const now = new Date();
    const patch: Partial<NewOrder> = { status, updatedAt: now };

    switch (status) {
      case 'confirmed': patch.confirmedAt = now; break;
      case 'processing': patch.fulfillmentStage = 'picking'; break;
      case 'shipped': patch.shippedAt = now; patch.fulfillmentStage = 'shipped'; break;
      case 'delivered': patch.deliveredAt = now; patch.paymentStatus = 'paid'; break;
      case 'cancelled':
        patch.cancelledAt = now;
        patch.cancelReason = opts.note ?? (opts.byCustomer ? 'Cancelled by customer' : 'Cancelled by admin');
        break;
      case 'returned':
        if (order.paymentStatus === 'paid') patch.paymentStatus = 'refunded';
        break;
    }

    if (status === 'cancelled' || status === 'returned') {
      await restoreStock(tx, order, status, opts.adminId ?? null);
    }

    if (status === 'delivered') {
      if (order.userId) {
        const user = await tx.query.users.findFirst({ where: eq(users.id, order.userId) });
        if (user) {
          const [s] = await tx.select().from(settings).where(eq(settings.key, 'loyalty_points_per_100_taka'));
          const per100 = Number(s?.value ?? 1);
          const points = Math.floor(order.total / 100) * per100;
          const newSpent = user.totalSpent + order.total;
          const newPoints = user.loyaltyPoints + points;
          const segment = newSpent >= 20000 ? 'vip' : user.totalOrders >= 2 ? 'regular' : user.segment;

          await tx.update(users).set({ totalSpent: newSpent, loyaltyPoints: newPoints, segment, updatedAt: now }).where(eq(users.id, user.id));
          if (points > 0) {
            await tx.insert(loyaltyTransactions).values({
              userId: user.id, orderId: order.id, type: 'earned', points, balanceAfter: newPoints,
              description: `Earned from order ${order.orderNumber}`,
            });
          }
        }
      }
      await tx.insert(transactions).values({
        type: 'income',
        amount: order.total,
        title: `Sale - Order ${order.orderNumber}`,
        orderId: order.id,
        paymentMethod: order.paymentMethod,
        referenceNumber: order.transactionId,
        transactionDate: toDateString(now),
        createdBy: opts.adminId ?? null,
      });
      if (order.courierId) {
        await tx.update(couriers).set({ successfulDeliveries: sql`${couriers.successfulDeliveries} + 1` }).where(eq(couriers.id, order.courierId));
      }
      await tx.update(shipments).set({ status: 'delivered', deliveredAt: now, updatedAt: now }).where(eq(shipments.orderId, order.id));
    }

    if (status === 'shipped') {
      await tx.update(shipments).set({ status: 'in_transit', pickedUpAt: now, updatedAt: now }).where(eq(shipments.orderId, order.id));
    }
    if (status === 'returned') {
      await tx.update(shipments).set({ status: 'returned', returnedAt: now, updatedAt: now }).where(eq(shipments.orderId, order.id));
    }
    if (opts.note && status !== 'cancelled') {
      patch.adminNote = order.adminNote ? `${order.adminNote}\n[${status}] ${opts.note}` : `[${status}] ${opts.note}`;
    }

    await tx.update(orders).set(patch).where(eq(orders.id, orderId));

    if (opts.adminId) {
      await tx.insert(staffLogs).values({
        adminId: opts.adminId, action: 'UPDATE_ORDER_STATUS', module: 'orders', targetId: orderId,
        details: { from: order.status, to: status, note: opts.note },
      });
    }

    return tx.query.orders.findFirst({ where: eq(orders.id, orderId), with: ORDER_WITH });
  });

  if (updated) {
    notifyOrderEvent(`order_${status}`, updated, {
      courier: updated.courier?.name,
      tracking: updated.shipments?.[0]?.trackingNumber,
    }).catch(() => {});
  }
  return updated!;
}

// ---------------- Assign courier ----------------
export async function assignCourier(orderId: number, input: AssignCourierInput, adminId: number) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { shipments: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (['cancelled', 'returned', 'delivered'].includes(order.status)) throw new ApiError(400, `Cannot assign courier to a ${order.status} order`);

  const courier = await db.query.couriers.findFirst({ where: and(eq(couriers.id, input.courierId), eq(couriers.isActive, true)) });
  if (!courier) throw new ApiError(404, 'Courier not found or inactive');

  const isDhaka = order.shippingAddress.district.trim().toLowerCase() === 'dhaka';
  const now = new Date();

  await db.transaction(async (tx) => {
    const existing = order.shipments[0];
    const history = [...(existing?.statusHistory ?? []), { status: 'assigned', note: `Assigned to ${courier.name}`, at: now.toISOString() }];
    const values = {
      courierId: courier.id,
      trackingNumber: input.trackingNumber ?? null,
      consignmentId: input.consignmentId ?? null,
      shippingCharge: isDhaka ? courier.insideDhakaCharge : courier.outsideDhakaCharge,
      codAmount: order.paymentMethod === 'cod' ? order.total : 0,
      weight: input.weight ?? null,
      status: 'pending' as const,
      statusHistory: history,
      updatedAt: now,
    };
    if (existing) await tx.update(shipments).set(values).where(eq(shipments.id, existing.id));
    else await tx.insert(shipments).values({ ...values, orderId: order.id });

    await tx
      .update(orders)
      .set({
        courierId: courier.id,
        fulfillmentStage: order.fulfillmentStage === 'pending' ? 'ready_to_ship' : order.fulfillmentStage,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    if (!existing) {
      await tx.update(couriers).set({ totalDeliveries: sql`${couriers.totalDeliveries} + 1` }).where(eq(couriers.id, courier.id));
    }
    await tx.insert(staffLogs).values({
      adminId, action: 'ASSIGN_COURIER', module: 'orders', targetId: order.id,
      details: { courier: courier.name, trackingNumber: input.trackingNumber },
    });
  });

  if (input.markAsShipped && order.status !== 'shipped') {
    return updateOrderStatus(orderId, 'shipped', { adminId });
  }
  return (await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: ORDER_WITH }))!;
}