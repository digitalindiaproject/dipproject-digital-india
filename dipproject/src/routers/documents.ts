import { Hono } from "hono";

const documentsRouter = new Hono<{ Bindings: { DB: any, DOCUMENTS_BUCKET: any } }>();

// Upload document
documentsRouter.post("/applications/:applicationId/documents", async (c) => {
  const applicationId = c.req.param("applicationId");
  const body = await c.req.parseBody();
  
  const file = body.file;
  if (!file || typeof file === "string") {
    return c.json({ error: "No file uploaded" }, 400);
  }
  
  // Validate file type
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "text/plain"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type. Allowed: PDF, JPG, PNG" }, 400);
  }
  
  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return c.json({ error: "File too large. Max 10MB" }, 400);
  }
  
  // Generate safe filename
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const storageKey = `applications/${applicationId}/${documentId}-${safeFilename}`;
  
  // Upload to R2
  await c.env.DOCUMENTS_BUCKET.put(storageKey, file);
  
  // Save metadata to DB
  const result = await c.env.DB.prepare(
    "INSERT INTO documents (application_id, user_id, filename, storage_key, mime_type, file_size, verification_status) VALUES (?, ?, ?, ?, ?, ?, 'pending') RETURNING *"
  ).bind(applicationId, 1, file.name, storageKey, file.type, file.size).all();
  
  if (result.results.length === 0) {
    return c.json({ error: "Failed to save document metadata" }, 500);
  }
  
  return c.json({ document: result.results[0] });
});

// Get documents for application
documentsRouter.get("/applications/:applicationId/documents", async (c) => {
  const applicationId = c.req.param("applicationId");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM documents WHERE application_id = ? ORDER BY created_at DESC"
  ).bind(applicationId).all();
  return c.json(results);
});

// Download document (with authorization)
documentsRouter.get("/documents/:documentId/download", async (c) => {
  const documentId = c.req.param("documentId");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM documents WHERE id = ?"
  ).bind(documentId).all();
  
  if (results.length === 0) {
    return c.json({ error: "Document not found" }, 404);
  }
  
  const doc = results[0];
  const object = await c.env.DOCUMENTS_BUCKET.get(doc.storage_key);
  
  if (!object) {
    return c.json({ error: "File not found in storage" }, 404);
  }
  
  return new Response(object.body, {
    headers: {
      "Content-Type": doc.mime_type,
      "Content-Disposition": `attachment; filename="${doc.filename}"`
    }
  });
});

export { documentsRouter };
