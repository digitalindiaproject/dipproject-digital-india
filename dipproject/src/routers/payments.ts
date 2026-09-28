import { Hono } from "hono";

const paymentsRouter = new Hono<{ Bindings: { DB: any, CASHFREE_APP_ID?: string, CASHFREE_SECRET_KEY?: string, CASHFREE_ENVIRONMENT?: string } }>();

// Create payment order (Cashfree integration)
paymentsRouter.post("/create", async (c) => {
  const db = c.env.DB;
  const { applicationId, userId, amount, currency = "INR" } = await c.req.json();
  
  // Generate order ID
  const orderId = `DIP_${Date.now()}_${applicationId}`;
  
  // Store payment record
  const result = await db.prepare("INSERT INTO payments (application_id, user_id, order_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, 'pending')").bind(applicationId, userId, orderId, amount, currency).run();
  
  // If Cashfree credentials are available, create Cashfree order
  const appId = c.env.CASHFREE_APP_ID;
  const secretKey = c.env.CASHFREE_SECRET_KEY;
  const env = c.env.CASHFREE_ENVIRONMENT || "SANDBOX";
  
  let paymentUrl = null;
  let paymentSessionId = null;
  
  if (appId && secretKey) {
    try {
      const cashfreeUrl = env === "PRODUCTION" ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";
      
      const response = await fetch(cashfreeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2023-08-01"
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: parseFloat(amount),
          order_currency: currency,
          customer_details: {
            customer_id: String(userId),
            customer_email: "",
            customer_phone: ""
          },
          order_meta: {
            return_url: `${c.req.header("origin") || "https://dipproject.digital-india.workers.dev"}/payment/success?order_id=${orderId}`,
            notify_url: `${c.req.header("origin") || "https://dipproject.digital-india.workers.dev"}/api/payments/webhook`
          }
        })
      });
      
      const data = await response.json();
      if (data.payment_session_id) {
        paymentSessionId = data.payment_session_id;
        await db.prepare("UPDATE payments SET cashfree_payment_id = ? WHERE id = ?").bind(paymentSessionId, result.last_row_id).run();
      }
    } catch (err) {
      console.error("Cashfree order creation failed:", err);
    }
  }
  
  return c.json({ 
    orderId, 
    paymentSessionId,
    paymentUrl: paymentSessionId ? `https://sandbox.cashfree.com/pg/checkout/post/${paymentSessionId}` : null
  });
});

// Payment webhook (Cashfree callback)
paymentsRouter.post("/webhook", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const secretKey = c.env.CASHFREE_SECRET_KEY;
  
  // Verify webhook signature (simplified - implement proper verification in production)
  // const signature = c.req.header("x-webhook-signature");
  
  if (body.order_id && body.payment_status) {
    const paymentStatus = body.payment_status === "SUCCESS" ? "completed" : "failed";
    
    await db.prepare("UPDATE payments SET status = ?, updated_at = datetime('now') WHERE order_id = ?").bind(paymentStatus, body.order_id).run();
    
    // Update application payment status
    const payment = await db.prepare("SELECT application_id FROM payments WHERE order_id = ?").bind(body.order_id).first();
    if (payment) {
      await db.prepare("UPDATE applications SET payment_status = ?, updated_at = datetime('now') WHERE id = ?").bind(paymentStatus, payment.application_id).run();
    }
  }
  
  return c.json({ received: true });
});

// Get payment status
paymentsRouter.get("/status/:orderId", async (c) => {
  const db = c.env.DB;
  const orderId = c.req.param("orderId");
  
  const payment = await db.prepare("SELECT * FROM payments WHERE order_id = ?").bind(orderId).first();
  
  if (!payment) {
    return c.json({ error: "Payment not found" }, 404);
  }
  
  return c.json(payment);
});

// Get payments for application
paymentsRouter.get("/application/:applicationId", async (c) => {
  const db = c.env.DB;
  const applicationId = c.req.param("applicationId");
  
  const payments = await db.prepare("SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC").bind(applicationId).all();
  
  return c.json(payments);
});

export { paymentsRouter };
