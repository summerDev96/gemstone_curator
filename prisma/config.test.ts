import { afterEach, describe, expect, it, vi } from "vitest";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalDirectDatabaseUrl = process.env.DIRECT_DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }

  if (originalDirectDatabaseUrl === undefined) {
    delete process.env.DIRECT_DATABASE_URL;
  } else {
    process.env.DIRECT_DATABASE_URL = originalDirectDatabaseUrl;
  }

  vi.resetModules();
});

describe("prisma.config", () => {
  it("uses DIRECT_DATABASE_URL for deployment migrations when it is configured", async () => {
    process.env.DATABASE_URL = "pooled-runtime-url";
    process.env.DIRECT_DATABASE_URL = "direct-migration-url";
    vi.resetModules();

    const config = (await import("../prisma.config")).default;

    expect(config.datasource?.url).toBe("direct-migration-url");
  });

  it("keeps the existing DATABASE_URL flow when DIRECT_DATABASE_URL is empty", async () => {
    process.env.DATABASE_URL = "local-development-url";
    process.env.DIRECT_DATABASE_URL = "";
    vi.resetModules();

    const config = (await import("../prisma.config")).default;

    expect(config.datasource?.url).toBe("local-development-url");
  });
});
