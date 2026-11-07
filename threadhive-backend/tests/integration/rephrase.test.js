import { beforeAll, describe, it, expect, vi } from "vitest";
import request from "supertest";
import "../setup.js";

const mockCreate = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {
      this.interactions = { create: mockCreate };
    }
  },
}));

import app from "../../src/app.js";

let jwtToken;

beforeAll(async () => {
  process.env.GEMINI_API_KEY = "test-key";
  const email = `reph+${Date.now()}@example.com`;
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Reph User", email, password: "password123", isAdmin: false });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  jwtToken = login.body.data.token;
});

const post = (body, token = jwtToken) => {
  const r = request(app).post("/api/ai/rephrase");
  if (token) r.set("Authorization", `Bearer ${token}`);
  return r.send(body);
};

describe("POST /api/ai/rephrase", () => {
  it("returns 200 with rephrased text", async () => {
    mockCreate.mockResolvedValue({ output_text: "Polished." });
    const res = await post({ text: "rough", type: "comment" });
    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe("Polished.");
  });

  it("returns 400 for missing text or bad type", async () => {
    expect((await post({ type: "title" })).status).toBe(400);
    expect((await post({ text: "x", type: "nope" })).status).toBe(400);
  });

  it("returns 502 when Gemini fails", async () => {
    mockCreate.mockRejectedValue(new Error("down"));
    const res = await post({ text: "rough", type: "body" });
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 without token", async () => {
    expect((await post({ text: "x", type: "body" }, null)).status).toBe(401);
  });
});
