import { beforeEach, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import '../setup.js';
import app from "../../src/app.js";
import Subreddit from "../../src/models/Subreddit.js";
import Thread from "../../src/models/Thread.js";
import Comment from "../../src/models/Comment.js";
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
describe("Comments API", () => {
    let subreddit;
    let thread;
    beforeEach(async () => {
        await Comment.deleteMany({});
        await Thread.deleteMany({});
        await Subreddit.deleteMany({});

        // Create a subreddit
        subreddit = await Subreddit.create({
            name: "Comment Test Subreddit",
            description: "Subreddit for comment tests",
            author: mockUser._id,
        });

        thread = await Thread.create({
            title: "Comment Test Thread",
            content: "Testing comments",
            author: mockUser._id,
            subreddit: subreddit._id,
        });

    });

    it("GET /api/comments/:threadId -> should return comments for thread", async () => {
        // Create comment via the API, so user is correctly linked
        await request(app)
            .post("/api/comments")
            .send({ thread: thread._id.toString(), content: "This is a test comment" })
            .set("Authorization", `Bearer ${jwtToken}`);

        const res = await request(app)
            .get(`/api/comments/thread/${thread._id}`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Comments fetched successfully");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].content).toBe("This is a test comment");
        expect(res.body.data[0].user).toHaveProperty("name", mockUser.name);
    });


    it("GET /api/comments/:threadId -> should return empty array if no comments", async () => {
        const res = await request(app)
            .get(`/api/comments/thread/${thread._id}`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Comments fetched successfully");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
    });

    it("POST /api/comments -> should create a new comment", async () => {
        const commentData = {
            thread: thread._id,
            content: "Creating a new comment",
        };

        const res = await request(app)
            .post("/api/comments")
            .send(commentData)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Comment created successfully");
        expect(res.body.data).toHaveProperty("_id");
        expect(res.body.data.content).toBe(commentData.content);
        expect(res.body.data.user).toHaveProperty("name", mockUser.name);
    });

});
