import express from "express";
import request from "supertest";
import { apiErrorEnvelope, unexpectedErrorHandler } from "./apiError.js";

describe("API error handling", () => {
  it("normalizes legacy route errors into the shared contract", async () => {
    const app = express();
    app.use(apiErrorEnvelope);
    app.get("/missing", (_request, response) => response.status(404).json({ error: "Missing" }));

    await expect(request(app).get("/missing")).resolves.toMatchObject({
      status: 404,
      body: { code: "not_found", error: "Missing" }
    });
  });

  it("returns JSON for unexpected synchronous errors", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const app = express();
    app.use(apiErrorEnvelope);
    app.get("/broken", () => {
      throw new Error("private detail");
    });
    app.use(unexpectedErrorHandler);

    await expect(request(app).get("/broken")).resolves.toMatchObject({
      status: 500,
      body: { code: "internal_error", error: "The request could not be completed" }
    });
    consoleError.mockRestore();
  });
});
