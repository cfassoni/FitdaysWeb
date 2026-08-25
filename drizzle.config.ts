import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DOCKER_MODE === "true" ? "file:/app/data/fitdays.db" : process.env.DATABASE_URL || "file:./fitdays.db",
  },
} satisfies Config;
