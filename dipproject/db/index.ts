import { drizzle } from "drizzle-orm/d1";

// Simple db helper for raw SQL queries
export const db = {
  sql: async (query: TemplateStringsArray | string, ...params: any[]) => {
    // This is a placeholder - actual D1 connection handled by Hono runtime
    return { results: [], success: true };
  }
};
