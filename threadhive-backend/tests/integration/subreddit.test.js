import { beforeEach,beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import '../setup.js';
import app from "../../src/app.js";
import Subreddit from "../../src/models/Subreddit.js";
import Thread from "../../src/models/Thread.js";
import dotenv from "dotenv";
dotenv.config();

let jwtToken;
let mockUser;

beforeAll(async () => {
  ({ mockUser, jwtToken } = await createUserAndLogin());
});

async function createUserAndLogin() {
  const email = `testuser+${Date.now()}@example.com`;
  const password = "password123";

  const userRes = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email,
      password,
      isAdmin: false,
    });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return {
    mockUser: userRes.body.data,
    jwtToken: loginRes.body.data.token,
  };
}

describe("Subreddits API", () => {
  beforeEach(async () => {
    await Thread.deleteMany({});
    await Subreddit.deleteMany({});
  });

  // -------------------
  // GET /api/subreddits
  // -------------------
  it("GET /api/subreddits -> should return list of subreddits when they exist", async () => {
    await Subreddit.create({ name: "exists", description: "desc", author: mockUser._id });

    const response = await request(app).get("/api/subreddits").set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(1);
  });

  it("GET /api/subreddits -> should return 404 if no subreddits exist", async () => {
    const response = await request(app).get("/api/subreddits").set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("No subreddits found");
  });
  
  // -------------------
  // POST /api/subreddits
  // -------------------
  it("POST /api/subreddits -> should create a subreddit", async () => {
    const response = await request(app).post("/api/subreddits").send({
      name: "testing",
      description: "This is a testing subreddit",
    }).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.name).toBe("testing");
  });

  it("POST /api/subreddits -> should fail with missing fields", async () => {
    const response = await request(app).post("/api/subreddits").send({
      name: "",
      description: "Missing name",
    })
    .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Name and description are required.");
  });

  it("POST /api/subreddits -> should fail if subreddit already exists", async () => {
    await Subreddit.create({ name: "existing", description: "desc", author: mockUser._id });

    const response = await request(app).post("/api/subreddits").send({
      name: "existing",
      description: "desc",
    })
    .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Subreddit with this name already exists.");
  });

  // -------------------
  // GET /api/subreddits/:id
  // -------------------
  it("GET /api/subreddits/:id -> should return subreddit with threads", async () => {
    const subreddit = await Subreddit.create({
      name: "subreddit-by-id",
      description: "Testing GET by ID",
      author: mockUser._id,
    });

    await Thread.create({
      title: "Test thread",
      content: "This is a test thread",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    const response = await request(app).get(`/api/subreddits/${subreddit._id}`).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.subreddit._id).toBe(subreddit._id.toString());
    expect(Array.isArray(response.body.data.threads)).toBe(true);
  });

  it("GET /api/subreddits/:id -> should return 404 if not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const response = await request(app).get(`/api/subreddits/${fakeId}`).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Subreddit not found");
  });
});