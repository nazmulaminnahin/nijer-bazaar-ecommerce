import { and, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { notifications, notificationTemplates } from '../schemas';
import { sendEmail } from './email.service';

interface OrderLike {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  total: number;
}

const TITLES: Record<string, string> = {
  order_placed: 'Order placed successfully',
  order_confirmed: 'Your order has been confirmed',
  order_processing: 'Your order is being prepared',
  order_shipped: 'Your order has been shipped',
  order_delivered: 'Your order has been delivered',
  order_cancelled: 'Your order has been cancelled',
  order_returned: 'Your order has been returned',
};

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => vars[key] ?? '');
}

export async function notifyOrderEvent(
  event: string,
  order: OrderLike,
  extra: { courier?: string | null; tracking?: string | null } = {}
): Promise<void> {
  try {
    const vars = {
      customer_name: order.customerName,
      order_number: order.orderNumber,
      total: String(order.total),
      courier: extra.courier ?? '',
      tracking: extra.tracking ?? '',
    };
    const title = TITLES[event] ?? `Order ${order.orderNumber} update`;

    // In-app notification for the customer
    if (order.userId) {
      await db.insert(notifications).values({
        userId: order.userId,
        channel: 'system',
        title,
        message: `Order ${order.orderNumber}: ${title.toLowerCase()}.`,
        link: `/profile?order=${order.orderNumber}`,
        status: 'sent',
        sentAt: new Date(),
      });
    }

    // In-app notification for admins on new orders
    if (event === 'order_placed') {
      await db.insert(notifications).values({
        channel: 'system',
        title: 'New order received',
        message: `${order.customerName} placed order ${order.orderNumber} (৳${order.total})`,
        link: `/admin/orders`,
        status: 'sent',
        sentAt: new Date(),
      });
    }

    // Email / SMS / WhatsApp via templates
    const templates = await db.query.notificationTemplates.findMany({
      where: and(eq(notificationTemplates.event, event), eq(notificationTemplates.isActive, true)),
    });

    for (const t of templates) {
      const recipient = t.channel === 'email' ? order.customerEmail : order.customerPhone;
      if (!recipient) continue;

      const body = render(t.body, vars);
      const subject = t.subject ? render(t.subject, vars) : title;

      const [row] = await db
        .insert(notifications)
        .values({ userId: order.userId, channel: t.channel, title: subject, message: body, recipient, status: 'pending' })
        .returning();

      let sent = false;
      let errorMessage: string | null = null;
      try {
        if (t.channel === 'email') {
          sent = await sendEmail(recipient, subject, body);
        } else {
          // SMS / WhatsApp gateway integration comes in Phase 8 — log for now
          console.log(`📱 [${t.channel.toUpperCase()} → ${recipient}] ${body}`);
          sent = true;
        }
      } catch (err) {
        errorMessage = (err as Error).message;
      }

      await db
        .update(notifications)
        .set({ status: sent ? 'sent' : 'failed', sentAt: sent ? new Date() : null, errorMessage })
        .where(eq(notifications.id, row.id));
    }
  } catch (err) {
    console.error('⚠️ Notification failed:', (err as Error).message);
  }
}