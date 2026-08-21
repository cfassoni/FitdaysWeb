import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DOCKER_MODE === "true" ? "file:./data/recomp_core.db" : process.env.DATABASE_URL || "file:./recomp_core.db",
  },
} satisfies Config;
