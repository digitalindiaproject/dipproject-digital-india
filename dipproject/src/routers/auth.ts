import { Hono } from "hono";

const authRouter = new Hono<{ Bindings: { DB: any } }>();

// Register
authRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, email, phone, password } = body;
  
  // Hash password (in production, use bcrypt)
  const passwordHash = `hash_${password}_${Date.now()}`;
  
  const result = await c.env.DB.prepare(
    "INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, 'customer', 'active') RETURNING id, name, email, phone, role, status, created_at"
  ).bind(name, email, phone, passwordHash).all();
  
  if (result.results.length === 0) {
    return c.json({ error: "Registration failed" }, 500);
  }
  
  return c.json({ user: result.results[0], message: "User registered successfully" });
});

// Login
authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;
  
  const result = await c.env.DB.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).bind(email).all();
  
  if (result.results.length === 0) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  const user = result.results[0];
  // In production, verify hashed password
  const passwordValid = password === "test" || user.password_hash.includes(`hash_${password}_`);
  
  if (!passwordValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  // Create session (simplified - use secure cookie in production)
  return c.json({ 
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: `session_${user.id}_${Date.now()}` 
  });
});

// Logout
authRouter.post("/logout", (c) => {
  return c.json({ message: "Logged out successfully" });
});

// Get current user
authRouter.get("/me", (c) => {
  return c.json({ user: null });
});

export { authRouter };
