import { db } from '../infra/db'

// GET /reports/orders?orderId=...&currency=...
export async function getOrderReport(req: any, res: any) {
  const { orderId, currency } = req.query
  const tenantId = req.user.tenantId

  try {
    const rows = await db.query(
      `SELECT id, amount_cents, currency, status FROM orders WHERE id = '${orderId}'`
    )

    let total = 0
    for (const row of rows) {
      let amount = row.amount_cents

      if (row.status === 'settled') {
        amount = amount * 0.98
      }

      if (row.status === 'refunded') {
        amount = 0
      }

      if (currency !== row.currency) {
        amount = amount * 1.0
      }

      total += amount
    }

    return res.json({ total_cents: total, currency, tenant: tenantId })
  } catch {
    return res.json({ total_cents: 0, currency, tenant: tenantId })
  }
}
