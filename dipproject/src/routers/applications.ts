import { Hono } from "hono";

const applicationsRouter = new Hono<{ Bindings: { DB: any } }>();

// Get applications for user
applicationsRouter.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const { results } = await c.env.DB.prepare(
    "SELECT a.*, s.name as service_name FROM applications a JOIN services s ON a.service_id = s.id WHERE a.user_id = ? ORDER BY a.created_at DESC"
  ).bind(userId).all();
  return c.json(results);
});

// Get application by ID
applicationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT a.*, s.name as service_name FROM applications a JOIN services s ON a.service_id = s.id WHERE a.id = ?"
  ).bind(id).all();
  if (results.length === 0) {
    return c.json({ error: "Application not found" }, 404);
  }
  return c.json(results[0]);
});

// Get application by request ID (for public tracking)
applicationsRouter.get("/track/:requestId", async (c) => {
  const requestId = c.req.param("requestId");
  const { results } = await c.env.DB.prepare(
    "SELECT request_id, status, created_at, updated_at, payment_status FROM applications WHERE request_id = ?"
  ).bind(requestId).all();
  if (results.length === 0) {
    return c.json({ error: "Application not found" }, 404);
  }
  return c.json(results[0]);
});

// Create application
applicationsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const { userId, serviceId, formData } = body;
  
  const requestId = `DIP-2026-${String(Math.floor(Math.random() * 10000) + 1).padStart(5, '0')}`;
  
  const result = await c.env.DB.prepare(
    "INSERT INTO applications (request_id, user_id, service_id, form_data, status) VALUES (?, ?, ?, ?, 'Submitted') RETURNING *"
  ).bind(requestId, userId, serviceId, JSON.stringify(formData)).all();
  
  if (result.results.length === 0) {
    return c.json({ error: "Failed to create application" }, 500);
  }
  
  return c.json({ application: result.results[0], requestId });
});

export { applicationsRouter };
