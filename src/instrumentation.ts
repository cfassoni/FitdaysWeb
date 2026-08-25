export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Prefix server-side console logs with timestamp [YYYY-MM-DD HH:mm:ss]
    const formatTimestamp = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      return `[${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
    };

    const methods = ["log", "info", "warn", "error"] as const;
    for (const method of methods) {
      const original = console[method];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (console as any)[method] = (...args: any[]) => {
        original(formatTimestamp(), ...args);
      };
    }

    try {
      const fs = await import("fs");
      const path = await import("path");
      const { migrate } = await import("drizzle-orm/libsql/migrator");
      const { db } = await import("@/db/client");

      if (process.env.DOCKER_MODE === "true") {
        const dataDir = path.resolve("/app/data");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
      }

      const migrationsFolder = path.resolve(process.cwd(), "./src/db/migrations");
      if (fs.existsSync(migrationsFolder)) {
        console.log("Checking and applying Drizzle database migrations...");
        await migrate(db, { migrationsFolder: "./src/db/migrations" });
        console.log("Drizzle migrations verified successfully.");
      }
    } catch (err) {
      console.error("Database initialization notice:", err);
    }
  }
}
