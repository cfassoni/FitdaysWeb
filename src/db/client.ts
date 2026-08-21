import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// For Phase 1, we use local SQLite. Later this will be swapped to Cloudflare D1.
// We implement a hybrid approach where DOCKER_MODE=true forces local SQLite.
const isDockerMode = process.env.DOCKER_MODE === "true" || process.env.NODE_ENV !== "production";

const client = createClient({
  url: isDockerMode ? "file:./recomp_core.db" : process.env.DATABASE_URL || "file:./recomp_core.db",
});

export const db = drizzle(client, { schema });
