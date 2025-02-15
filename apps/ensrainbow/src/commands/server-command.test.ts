import { promises as fs } from "fs";
import { ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk/consts";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import type {
  CountResponse,
  CountServerError,
  CountSuccess,
  HealBadRequestError,
  HealNotFoundError,
  HealResponse,
  HealSuccess,
  HealthResponse,
} from "@ensnode/ensrainbow-sdk/types";
import { serve } from "@hono/node-server";
import { labelhash } from "viem";
/// <reference types="vitest" />
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "../lib/database";
import type { ENSRainbowDB } from "../lib/database";
import { LABELHASH_COUNT_KEY } from "../lib/database";
import { createServer } from "./server-command";

describe("Server Command Tests", () => {
  let db: ENSRainbowDB;
  const port = 3223;
  let app: ReturnType<typeof createServer>;
  let server: ReturnType<typeof serve>;

  beforeAll(async () => {
    db = await createDatabase("test-data-server", "error");
    app = createServer(db, console);

    // Start the server on a different port than what ENSRainbow defaults to
    server = serve({
      fetch: app.fetch,
      port,
    });
  });

  beforeEach(async () => {
    // Clear database before each test
    for await (const key of db.keys()) {
      await db.del(key);
    }
  });

  afterAll(async () => {
    // Cleanup
    await server.close();
    await db.close();

    // Remove test database directory
    await fs.rm("test-data-server", { recursive: true, force: true });
  });

  describe("GET /v1/heal/:labelhash", () => {
    it("should return the label for a valid labelhash", async () => {
      const validLabel = "test-label";
      const validLabelhash = labelhash(validLabel);

      // Add test data
      const labelHashBytes = labelHashToBytes(validLabelhash);
      await db.put(labelHashBytes, validLabel);

      const response = await fetch(`http://localhost:${port}/v1/heal/${validLabelhash}`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as HealResponse;
      const expectedData: HealSuccess = {
        status: StatusCode.Success,
        label: validLabel,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle missing labelhash parameter", async () => {
      const response = await fetch(`http://localhost:${port}/v1/heal/`);
      expect(response.status).toBe(404); // Hono returns 404 for missing parameters
      const text = await response.text();
      expect(text).toBe("404 Not Found"); // Hono's default 404 response
    });

    it("should reject invalid labelhash format", async () => {
      const response = await fetch(`http://localhost:${port}/v1/heal/invalid-hash`);
      expect(response.status).toBe(400);
      const data = (await response.json()) as HealResponse;
      const expectedData: HealBadRequestError = {
        status: StatusCode.Error,
        error: "Invalid labelhash length 12 characters (expected 66)",
        errorCode: ErrorCode.BadRequest,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle non-existent labelhash", async () => {
      const nonExistentHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const response = await fetch(`http://localhost:${port}/v1/heal/${nonExistentHash}`);
      expect(response.status).toBe(404);
      const data = (await response.json()) as HealResponse;
      const expectedData: HealNotFoundError = {
        status: StatusCode.Error,
        error: "Label not found",
        errorCode: ErrorCode.NotFound,
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /health", () => {
    it("should return ok status", async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      const expectedData: HealthResponse = {
        status: "ok",
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /v1/labels/count", () => {
    it("should throw an error when database is empty", async () => {
      const response = await fetch(`http://localhost:${port}/v1/labels/count`);
      expect(response.status).toBe(500);
      const data = (await response.json()) as CountResponse;
      const expectedData: CountServerError = {
        status: StatusCode.Error,
        error: "Label count not initialized. Check that the ingest command has been run.",
        errorCode: ErrorCode.ServerError,
      };
      expect(data).toEqual(expectedData);
    });

    it("should return correct count from LABEL_COUNT_KEY", async () => {
      // Set a specific count in the database
      await db.put(LABELHASH_COUNT_KEY, "42");

      const response = await fetch(`http://localhost:${port}/v1/labels/count`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as CountResponse;
      const expectedData: CountSuccess = {
        status: StatusCode.Success,
        count: 42,
        timestamp: expect.any(String),
      };
      expect(data).toEqual(expectedData);
      expect(() => new Date(data.timestamp as string)).not.toThrow(); // valid timestamp
    });
  });
});
