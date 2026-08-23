import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isSwaggerEnabled, openApiSpec } from "../openapi";
import { GET as openApiHandler } from "../../app/api/openapi.json/route";

describe("OpenAPI Documentation & Security Gating", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isSwaggerEnabled should be true in development/test environment", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isSwaggerEnabled()).toBe(true);
  });

  it("isSwaggerEnabled should be false in production environment unless ENABLE_SWAGGER=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_SWAGGER", "");
    expect(isSwaggerEnabled()).toBe(false);

    vi.stubEnv("ENABLE_SWAGGER", "true");
    expect(isSwaggerEnabled()).toBe(true);
  });

  it("GET /api/openapi.json should return 200 with OpenAPI 3 spec when enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await openApiHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.openapi).toBe("3.0.3");
    expect(data.paths).toBeDefined();
    expect(data.paths["/api/users/login"]).toBeDefined();
  });

  it("GET /api/openapi.json should return 404 in production environment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_SWAGGER", "");
    const res = await openApiHandler();
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.detail).toBe("Not found");
  });
});
