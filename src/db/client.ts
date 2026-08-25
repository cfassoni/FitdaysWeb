import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Determine database path depending on environment
const isDockerMode = process.env.DOCKER_MODE === "true";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (isDockerMode) {
    return "file:/app/data/fitdays.db";
  }

  // Check if backend database exists for local development side-by-side
  const backendDbPath = path.resolve(process.cwd(), "../backend/fitdays.db");
  if (fs.existsSync(backendDbPath)) {
    return `file:${backendDbPath}`;
  }

  // Fallback to root or local fitdays.db
  return "file:./fitdays.db";
}

const client = createClient({
  url: getDatabaseUrl(),
});

export const db = drizzle(client, { schema });
