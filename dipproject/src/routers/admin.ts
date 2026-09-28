import { Hono } from "hono";

const adminRouter = new Hono<{ Bindings: { DB: any } }>();



// Admin dashboard stats
adminRouter.get("/stats", async (c) => {
  const db = c.env.DB;
  const stats = await db.prepare("SELECT (SELECT COUNT(*) FROM users WHERE role = 'customer') as totalCustomers, (SELECT COUNT(*) FROM applications) as totalApplications, (SELECT COUNT(*) FROM applications WHERE status = 'Submitted') as pendingApplications, (SELECT COUNT(*) FROM applications WHERE status = 'Completed') as completedApplications, (SELECT COUNT(*) FROM documents WHERE verification_status = 'pending') as pendingDocuments, (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completedPayments").first();
  
  return c.json(stats);
});

// Admin get all applications with filters
adminRouter.get("/applications", async (c) => {
  const db = c.env.DB;
  const status = c.req.query("status");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  
  let query = "SELECT a.*, u.name as user_name, u.email as user_email, s.name as service_name FROM applications a JOIN users u ON a.user_id = u.id JOIN services s ON a.service_id = s.id WHERE 1=1";
  const params = [];
  
  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }
  
  query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const applications = await db.prepare(query).bind(...params).all();
  return c.json(applications);
});

// Admin get application details
adminRouter.get("/applications/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const app = await db.prepare("SELECT a.*, u.name as user_name, u.email as user_email, u.phone as user_phone, s.name as service_name FROM applications a JOIN users u ON a.user_id = u.id JOIN services s ON a.service_id = s.id WHERE a.id = ?").bind(id).first();
  
  if (!app) {
    return c.json({ error: "Application not found" }, 404);
  }
  
  const documents = await db.prepare("SELECT * FROM documents WHERE application_id = ?").bind(id).all();
  const payments = await db.prepare("SELECT * FROM payments WHERE application_id = ?").bind(id).all();
  const history = await db.prepare("SELECT * FROM application_status_history WHERE application_id = ? ORDER BY created_at DESC").bind(id).all();
  
  return c.json({ application: app, documents, payments, history });
});

// Admin update application status
adminRouter.put("/applications/:id/status", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const { status, note, visibleToCustomer, changedBy } = await c.req.json();
  
  await db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, id).run();
  
  await db.prepare("INSERT INTO application_status_history (application_id, status, note, visible_to_customer, changed_by) VALUES (?, ?, ?, ?, ?)").bind(id, status, note || "", visibleToCustomer ? 1 : 0, changedBy || "admin").run();
  
  return c.json({ message: "Status updated" });
});

// Admin update document verification
adminRouter.put("/documents/:id/verify", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const { status } = await c.req.json();
  
  await db.prepare("UPDATE documents SET verification_status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, id).run();
  
  return c.json({ message: "Document verification updated" });
});

// Admin get all services
adminRouter.get("/services", async (c) => {
  const db = c.env.DB;
  const services = await db.prepare("SELECT * FROM services ORDER BY created_at DESC").all();
  return c.json(services);
});

// Admin create/update service
adminRouter.post("/services", async (c) => {
  const db = c.env.DB;
  const { slug, name, name_hi, description, description_hi, category, price, active } = await c.req.json();
  
  const result = await db.prepare("INSERT INTO services (slug, name, name_hi, description, description_hi, category, price, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(slug, name, name_hi || "", description || "", description_hi || "", category || "", price || "", active ? 1 : 0).run();
  
  return c.json({ id: result.last_row_id });
});

adminRouter.put("/services/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const { name, name_hi, description, description_hi, category, price, active } = await c.req.json();
  
  await db.prepare("UPDATE services SET name = ?, name_hi = ?, description = ?, description_hi = ?, category = ?, price = ?, active = ?, updated_at = datetime('now') WHERE id = ?").bind(name, name_hi || "", description || "", description_hi || "", category || "", price || "", active ? 1 : 0, id).run();
  
  return c.json({ message: "Service updated" });
});

// Admin get all users
adminRouter.get("/users", async (c) => {
  const db = c.env.DB;
  const users = await db.prepare("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC").all();
  return c.json(users);
});

// Admin get payments
adminRouter.get("/payments", async (c) => {
  const db = c.env.DB;
  const payments = await db.prepare("SELECT p.*, a.request_id, u.name as user_name FROM payments p JOIN applications a ON p.application_id = a.id JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC").all();
  return c.json(payments);
});

export { adminRouter };
