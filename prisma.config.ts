import { defineConfig } from "prisma/config";

// DIRECT_URL (unpooled) is for migrations; the app itself uses the pooled DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/personal_dashboard",
  },
});
