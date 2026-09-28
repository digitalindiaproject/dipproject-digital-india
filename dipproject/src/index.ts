import { Hono } from "hono";
import { servicesRouter } from "./routers/services.ts";
import { authRouter } from "./routers/auth.ts";
import { applicationsRouter } from "./routers/applications.ts";
import { documentsRouter } from "./routers/documents.ts";
import { adminRouter } from "./routers/admin.ts";
import { paymentsRouter } from "./routers/payments.ts";

const app = new Hono<{ Bindings: { DB: any, DOCUMENTS_BUCKET: any, CASHFREE_APP_ID?: string, CASHFREE_SECRET_KEY?: string, CASHFREE_ENVIRONMENT?: string } }>();

// Health check
app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

// Services API
app.route("/api/services", servicesRouter);

// Auth API
app.route("/api/auth", authRouter);

// Applications API
app.route("/api/applications", applicationsRouter);

// Documents API
app.route("/api", documentsRouter);

// Admin API
app.route("/api/admin", adminRouter);

// Payments API
app.route("/api/payments", paymentsRouter);

export default app;
