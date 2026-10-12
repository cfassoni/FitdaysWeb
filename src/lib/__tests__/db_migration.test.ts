import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { migrateLegacyDatabaseFile, getDatabaseUrl } from "@/db/client";
import { migrateLegacySchemaTables } from "@/db/initDb";

describe("Database File & Schema Rebrand Migration", () => {
  const originalDbUrl = process.env.DATABASE_URL;
  const originalDockerMode = process.env.DOCKER_MODE;
  const tempDirs: string[] = [];

  function createTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recomp-db-test-"));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    if (originalDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDbUrl;
    }

    if (originalDockerMode === undefined) {
      delete process.env.DOCKER_MODE;
    } else {
      process.env.DOCKER_MODE = originalDockerMode;
    }

    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("migrateLegacyDatabaseFile renames fitdays.db and WAL/SHM sidecars to recomp_pro.db when target does not exist", () => {
    const dir = createTempDir();
    const legacyDb = path.join(dir, "fitdays.db");
    const legacyWal = path.join(dir, "fitdays.db-wal");
    const legacyShm = path.join(dir, "fitdays.db-shm");
    const targetDb = path.join(dir, "recomp_pro.db");

    fs.writeFileSync(legacyDb, "sqlite-main-bytes");
    fs.writeFileSync(legacyWal, "sqlite-wal-bytes");
    fs.writeFileSync(legacyShm, "sqlite-shm-bytes");

    migrateLegacyDatabaseFile(targetDb);

    expect(fs.existsSync(legacyDb)).toBe(false);
    expect(fs.existsSync(legacyWal)).toBe(false);
    expect(fs.existsSync(legacyShm)).toBe(false);
    expect(fs.readFileSync(targetDb, "utf-8")).toBe("sqlite-main-bytes");
    expect(fs.readFileSync(`${targetDb}-wal`, "utf-8")).toBe("sqlite-wal-bytes");
    expect(fs.readFileSync(`${targetDb}-shm`, "utf-8")).toBe("sqlite-shm-bytes");
  });

  it("migrateLegacyDatabaseFile does not overwrite an existing recomp_pro.db", () => {
    const dir = createTempDir();
    const legacyDb = path.join(dir, "fitdays.db");
    const targetDb = path.join(dir, "recomp_pro.db");

    fs.writeFileSync(legacyDb, "old-bytes");
    fs.writeFileSync(targetDb, "current-bytes");

    migrateLegacyDatabaseFile(targetDb);

    expect(fs.existsSync(legacyDb)).toBe(true);
    expect(fs.readFileSync(targetDb, "utf-8")).toBe("current-bytes");
  });

  it("getDatabaseUrl transparently redirects a legacy DATABASE_URL=file:.../fitdays.db to recomp_pro.db and migrates the file", () => {
    const dir = createTempDir();
    const legacyDb = path.join(dir, "fitdays.db");
    const targetDb = path.join(dir, "recomp_pro.db");
    fs.writeFileSync(legacyDb, "migrated-db-content");

    process.env.DATABASE_URL = `file:${legacyDb}`;
    const resolvedUrl = getDatabaseUrl();

    expect(resolvedUrl).toBe(`file:${targetDb}`);
    expect(fs.existsSync(legacyDb)).toBe(false);
    expect(fs.readFileSync(targetDb, "utf-8")).toBe("migrated-db-content");
  });

  it("migrateLegacySchemaTables renames fitdays_records and fitdays_reports to recomp_records and recomp_reports preserving rows", async () => {
    const client = createClient({ url: ":memory:" });
    const testDb = drizzle(client, { schema });

    await testDb.run(sql`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        hashed_password TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    await testDb.run(sql`
      CREATE TABLE fitdays_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date INTEGER NOT NULL,
        weight REAL NOT NULL
      );
    `);

    await testDb.run(sql`
      CREATE TABLE fitdays_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL REFERENCES fitdays_records(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_at INTEGER NOT NULL
      );
    `);
    await testDb.run(
      sql`CREATE UNIQUE INDEX fitdays_reports_record_id_unique ON fitdays_reports (record_id);`
    );

    await testDb.run(
      sql`INSERT INTO users (id, email, hashed_password, created_at) VALUES (1, 'legacy@example.com', 'hash', 1700000000);`
    );
    await testDb.run(
      sql`INSERT INTO fitdays_records (id, user_id, date, weight) VALUES (10, 1, 1700000000, 81.5);`
    );
    await testDb.run(
      sql`INSERT INTO fitdays_reports (id, record_id, file_path, filename, mime_type, file_size, uploaded_at) VALUES (20, 10, '/tmp/r.pdf', 'r.pdf', 'application/pdf', 1024, 1700000000);`
    );

    await migrateLegacySchemaTables(testDb);

    // Verify old table names no longer exist and new table names exist
    const tables = await testDb.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('fitdays_records', 'recomp_records', 'fitdays_reports', 'recomp_reports')`
    );
    const tableNames = tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(["recomp_records", "recomp_reports"]);

    // Verify data and starred column were preserved/added
    const records = await testDb.all<{ id: number; weight: number; starred: number }>(
      sql`SELECT id, weight, starred FROM recomp_records`
    );
    expect(records).toEqual([{ id: 10, weight: 81.5, starred: 0 }]);

    const reports = await testDb.all<{ id: number; record_id: number; filename: string }>(
      sql`SELECT id, record_id, filename FROM recomp_reports`
    );
    expect(reports).toEqual([{ id: 20, record_id: 10, filename: "r.pdf" }]);

    // Running a second time is idempotent
    await migrateLegacySchemaTables(testDb);
  });
});
