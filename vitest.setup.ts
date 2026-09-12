import "@testing-library/jest-dom/vitest";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
