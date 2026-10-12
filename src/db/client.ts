import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

/**
 * Automatically migrates a legacy `fitdays.db` file (and any SQLite WAL/SHM sidecars)
 * in the same directory to `recomp_pro.db` if `recomp_pro.db` does not exist yet.
 */
export function migrateLegacyDatabaseFile(targetDbPath: string): void {
  try {
    const resolvedTarget = path.resolve(targetDbPath);
    if (path.basename(resolvedTarget) !== "recomp_pro.db") {
      return;
    }

    const dir = path.dirname(resolvedTarget);
    const legacyDbPath = path.join(dir, "fitdays.db");

    if (
      !fs.existsSync(/*turbopackIgnore: true*/ resolvedTarget) &&
      fs.existsSync(/*turbopackIgnore: true*/ legacyDbPath)
    ) {
      if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
        fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
      }
      fs.renameSync(/*turbopackIgnore: true*/ legacyDbPath, /*turbopackIgnore: true*/ resolvedTarget);

      for (const suffix of ["-wal", "-shm"]) {
        const legacySidecar = `${legacyDbPath}${suffix}`;
        const targetSidecar = `${resolvedTarget}${suffix}`;
        if (
          fs.existsSync(/*turbopackIgnore: true*/ legacySidecar) &&
          !fs.existsSync(/*turbopackIgnore: true*/ targetSidecar)
        ) {
          fs.renameSync(/*turbopackIgnore: true*/ legacySidecar, /*turbopackIgnore: true*/ targetSidecar);
        }
      }
    }
  } catch (err) {
    console.warn("Legacy database file migration check notice:", err);
  }
}

export function getDatabaseUrl(): string {
  const isDockerMode = process.env.DOCKER_MODE === "true";

  if (process.env.DATABASE_URL) {
    const rawUrl = process.env.DATABASE_URL;
    if (rawUrl.startsWith("file:")) {
      const filePart = rawUrl.slice("file:".length);
      if (path.basename(filePart) === "fitdays.db") {
        const updatedFilePart = path.join(path.dirname(filePart), "recomp_pro.db");
        migrateLegacyDatabaseFile(updatedFilePart);
        return `file:${updatedFilePart}`;
      }
      if (path.basename(filePart) === "recomp_pro.db") {
        migrateLegacyDatabaseFile(filePart);
      }
    }
    return rawUrl;
  }

  if (isDockerMode) {
    const dockerDbPath = "/app/data/recomp_pro.db";
    migrateLegacyDatabaseFile(dockerDbPath);
    return `file:${dockerDbPath}`;
  }

  migrateLegacyDatabaseFile(path.resolve(process.cwd(), "recomp_pro.db"));
  return "file:./recomp_pro.db";
}

const client = createClient({
  url: getDatabaseUrl(),
});

export const db = drizzle(client, { schema });
