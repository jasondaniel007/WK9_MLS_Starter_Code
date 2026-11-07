import { beforeEach,beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import '../setup.js';
import app from "../../src/app.js";
import Thread from "../../src/models/Thread.js";
import Subreddit from "../../src/models/Subreddit.js";
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

describe("Threads API", () => {
  let subreddit;

  // Reset database and create a fresh subreddit before each test
  beforeEach(async () => {
    await Thread.deleteMany({});
    await Subreddit.deleteMany({});

    subreddit = await Subreddit.create({
      name: "test-subreddit-threads",
      description: "Subreddit for thread tests",
      author: mockUser._id,
    });
  });

  // -------------------
  // GET /api/threads (all)
  // -------------------
  it("GET /api/threads -> should return list of threads when threads exist", async () => {
    // Create a thread so the DB is not empty
    await Thread.create({
      title: "Test thread",
      content: "Content",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    const response = await request(app).get("/api/threads").set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(1);
  });

  // -------------------
  // GET /api/threads/:id
  // -------------------
  it("GET /api/threads/:id -> should return a single thread", async () => {
    const thread = await Thread.create({
      title: "Thread for GET by ID",
      content: "Testing GET by ID",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    const response = await request(app).get(`/api/threads/${thread._id}`).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(thread._id.toString());
  });

  it("GET /api/threads/:id -> should return 404 if thread not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011"; // valid ObjectId but does not exist
    const response = await request(app).get(`/api/threads/${fakeId}`).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Thread not found");
  });


  // -------------------
  // POST /api/threads
  // -------------------
  it("POST /api/threads -> should create a thread", async () => {
    const response = await request(app).post("/api/threads").send({
      title: "How to test Threads API?",
      content: "I want to test my threads routes using Vitest + Supertest.",
      subreddit: subreddit._id,
    }).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.title).toBe("How to test Threads API?");
  });

  it("POST /api/threads -> should return 400 if title is missing", async () => {
    const response = await request(app).post("/api/threads").send({
      content: "This thread has no title",
      subreddit: subreddit._id,
    }).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Title, content, and subreddit are required.");
  });

  // -------------------
  // PUT /api/threads/:id
  // -------------------
  it("PUT /api/threads/:id -> should update a thread", async () => {
    const thread = await Thread.create({
      title: "Thread to be updated",
      content: "Original content",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    const response = await request(app)
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({
        title: "Updated thread title",
        content: "Updated content",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Updated thread title");
  });

  it("PUT /api/threads/:id -> should return 404 if thread not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const response = await request(app)
      .put(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({ title: "Updated title" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Thread not found");
  });

  // -------------------
  // DELETE /api/threads/:id
  // -------------------
  it("DELETE /api/threads/:id -> should delete a thread", async () => {
    const thread = await Thread.create({
      title: "Thread to delete",
      content: "This will be deleted",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    const response = await request(app).delete(`/api/threads/${thread._id}`).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Thread deleted successfully");

    const deletedThread = await Thread.findById(thread._id);
    expect(deletedThread).toBeNull();
  });

  it("DELETE /api/threads/:id -> should return 404 if thread not found", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const response = await request(app).delete(`/api/threads/${fakeId}`).set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Thread not found");
  });
});