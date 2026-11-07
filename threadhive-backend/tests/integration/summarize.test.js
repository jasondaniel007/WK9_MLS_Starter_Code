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
import Thread from "../../src/models/Thread.js";
import Subreddit from "../../src/models/Subreddit.js";
import mongoose from "mongoose";

let jwtToken, mockUser;

beforeAll(async () => {
  process.env.GEMINI_API_KEY = "test-key";
  const email = `summ+${Date.now()}@example.com`;
  const reg = await request(app)
    .post("/api/auth/register")
    .send({ name: "Sum User", email, password: "password123", isAdmin: false });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  mockUser = reg.body.data;
  jwtToken = login.body.data.token;
});

describe("POST /api/threads/:id/summarize", () => {
  const makeThread = async () => {
    const sub = await Subreddit.create({ name: `s-${Date.now()}`, description: "d", author: mockUser._id });
    return Thread.create({ title: "T", content: "C", author: mockUser._id, subreddit: sub._id });
  };

  it("returns 200 with summary", async () => {
    const thread = await makeThread();
    mockCreate.mockResolvedValue({ output_text: "Summary text." });
    const res = await request(app)
      .post(`/api/threads/${thread._id}/summarize`)
      .set("Authorization", `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBe("Summary text.");
  });

  it("returns 502 when Gemini fails", async () => {
    const thread = await makeThread();
    mockCreate.mockRejectedValue(new Error("down"));
    const res = await request(app)
      .post(`/api/threads/${thread._id}/summarize`)
      .set("Authorization", `Bearer ${jwtToken}`);
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for missing thread", async () => {
    const res = await request(app)
      .post(`/api/threads/${new mongoose.Types.ObjectId()}/summarize`)
      .set("Authorization", `Bearer ${jwtToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).post(`/api/threads/${new mongoose.Types.ObjectId()}/summarize`);
    expect(res.status).toBe(401);
  });
});
