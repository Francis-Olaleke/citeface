import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Safety guard: tests wipe tables, so they may only run against the test database.
const root = process.cwd();
const testFile = path.join(root, ".env.test");

if (!fs.existsSync(testFile)) {
  throw new Error("apps/api/.env.test is missing. Tests need a separate test database.");
}

const testUrl = dotenv.parse(fs.readFileSync(testFile)).DATABASE_URL;
if (!testUrl) {
  throw new Error("DATABASE_URL is not set in apps/api/.env.test.");
}

const devFile = path.join(root, ".env");
if (fs.existsSync(devFile)) {
  const devUrl = dotenv.parse(fs.readFileSync(devFile)).DATABASE_URL;
  if (devUrl && new URL(devUrl).host === new URL(testUrl).host) {
    throw new Error("Refusing to run: test and development databases share a host.");
  }
}

process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = "test";
