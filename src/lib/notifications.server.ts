import type { Order, OrderStatus } from '@/routes/api.orders'

const STATUS_COPY: Record<OrderStatus, { subject: string; line: string }> = {
  pending: {
    subject: 'Order Request Received',
    line: "We got your order request! We're reviewing your payment now.",
  },
  payment_received: {
    subject: 'Payment Received',
    line: "Payment confirmed. We'll pick up your order shortly.",
  },
  picked_up: {
    subject: 'Order Being Picked Up',
    line: "Your order is being picked up now.",
  },
  out_for_delivery: {
    subject: 'Out for Delivery',
    line: "Good news — your order is out for delivery!",
  },
  delivered: {
    subject: 'Order Delivered',
    line: "Your order has been delivered. Thanks for choosing PayJayden!",
  },
  delayed: {
    subject: 'Order Delayed',
    line: "Your order has been delayed.",
  },
  cancelled: {
    subject: 'Order Cancelled',
    line: "Your order has been cancelled.",
  },
}

function formatEST(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' EST'
}

function buildEmailHtml(order: Order, status: OrderStatus, reason?: string): string {
  const copy = STATUS_COPY[status]
  const shortId = order.id.slice(-8)
  const reasonBlock = reason
    ? `<div style="margin-top:16px;padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;"><p style="margin:0;color:#92400e;font-weight:600;">Reason</p><p style="margin:4px 0 0 0;color:#78350f;">${escapeHtml(reason)}</p></div>`
    : ''
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="padding:24px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-weight:800;font-size:18px;color:#111827;">Pay<span style="color:#2563eb;">Jayden</span></p>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 8px 0;font-size:20px;color:#111827;">${copy.subject}</h1>
      <p style="margin:0 0 16px 0;color:#374151;line-height:1.5;">Hi ${escapeHtml(order.customerName)}, ${copy.line}</p>
      ${reasonBlock}
      <div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:12px;">
        <p style="margin:0;color:#6b7280;font-size:12px;">Order #${shortId}</p>
        <p style="margin:4px 0 0 0;font-weight:700;color:#111827;">Total $${order.total.toFixed(2)}</p>
        <p style="margin:4px 0 0 0;color:#6b7280;font-size:13px;">${escapeHtml(order.items.map(i => `${i.name} ×${i.quantity}`).join(', '))}</p>
      </div>
      <p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;">Updated ${formatEST(new Date().toISOString())}</p>
    </div>
  </div>
</body></html>`
}

function buildSmsText(order: Order, status: OrderStatus, reason?: string): string {
  const copy = STATUS_COPY[status]
  const shortId = order.id.slice(-8)
  const base = `PayJayden: ${copy.line} Order #${shortId} ($${order.total.toFixed(2)}).`
  return reason ? `${base} Reason: ${reason}` : base
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[notifications] email not sent (RESEND_API_KEY not set). To: ${to} / ${subject}`)
    return false
  }
  const from = process.env.NOTIFICATION_FROM_EMAIL || 'PayJayden <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      console.error('[notifications] Resend responded', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[notifications] email send failed', err)
    return false
  }
}

async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM
  if (!sid || !token || !from) {
    console.log(`[notifications] SMS not sent (Twilio env vars not set). To: ${to} / ${body.slice(0, 80)}`)
    return false
  }
  const normalized = normalizePhone(to)
  if (!normalized) {
    console.log(`[notifications] SMS skipped — invalid phone "${to}"`)
    return false
  }
  try {
    const params = new URLSearchParams({ To: normalized, From: from, Body: body })
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    if (!res.ok) {
      console.error('[notifications] Twilio responded', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[notifications] sms send failed', err)
    return false
  }
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('+')) return digits
  const only = digits.replace(/\D/g, '')
  if (only.length === 10) return `+1${only}`
  if (only.length === 11 && only.startsWith('1')) return `+${only}`
  return null
}

export async function notifyOrderStatus(
  order: Order,
  status: OrderStatus,
  reason?: string,
): Promise<void> {
  const copy = STATUS_COPY[status]
  if (!copy) return

  const subject = `PayJayden — ${copy.subject} (Order #${order.id.slice(-8)})`
  const html = buildEmailHtml(order, status, reason)
  const sms = buildSmsText(order, status, reason)

  const emailAddresses = new Set<string>()
  if (order.email) emailAddresses.add(order.email)
  if (order.userEmail) emailAddresses.add(order.userEmail)

  const tasks: Promise<unknown>[] = []
  for (const addr of emailAddresses) {
    tasks.push(sendEmail(addr, subject, html))
  }
  if (order.phone) tasks.push(sendSms(order.phone, sms))

  await Promise.allSettled(tasks)
}
