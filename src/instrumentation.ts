export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { migrate } = await import("drizzle-orm/libsql/migrator");
      const { db } = await import("@/db/client");

      if (process.env.DOCKER_MODE === "true") {
        const dataDir = path.resolve("./data");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
      }

      console.log("Running Drizzle database migrations on startup...");
      await migrate(db, { migrationsFolder: "./src/db/migrations" });
      console.log("Database migrations applied successfully.");
    } catch (err) {
      console.error("Database migration error:", err);
    }
  }
}
