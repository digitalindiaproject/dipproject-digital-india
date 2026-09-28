import { Hono } from "hono";

const servicesRouter = new Hono<{ Bindings: { DB: any } }>();

// Get all services
servicesRouter.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM services WHERE active = 1"
  ).all();
  return c.json(results);
});

// Get single service
servicesRouter.get("/:slug", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM services WHERE slug = ? AND active = 1"
  ).bind(c.req.param("slug")).all();
  if (results.length === 0) {
    return c.json({ error: "Service not found" }, 404);
  }
  return c.json(results[0]);
});

export { servicesRouter };
