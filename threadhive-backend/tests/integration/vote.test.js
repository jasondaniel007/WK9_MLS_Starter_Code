import { beforeEach, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import '../setup.js';
import app from "../../src/app.js";
import Thread from "../../src/models/Thread.js";
import Comment from "../../src/models/Comment.js";
import dotenv from "dotenv";
import Subreddit from "../../src/models/Subreddit.js";
dotenv.config();

let jwtToken;
let mockUser;

beforeAll(async () => {
    ({ mockUser, jwtToken } = await createUserAndLogin());
});

async function createUserAndLogin() {
    const email = `voteuser+${Date.now()}@example.com`;
    const password = "password123";

    const userRes = await request(app)
        .post("/api/auth/register")
        .send({ name: "Vote User", email, password, isAdmin: false });

    const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

    return {
        mockUser: userRes.body.data,
        jwtToken: loginRes.body.data.token,
    };
}

describe("Vote API", () => {
    let thread;
    let comment;
    let subreddit;

    beforeEach(async () => {
        await Thread.deleteMany({});
        await Comment.deleteMany({});
        await Subreddit.deleteMany({});

        // Create a subreddit
        subreddit = await Subreddit.create({
            name: "Vote Test Subreddit",
            description: "Subreddit for voting tests",
            author: mockUser._id,
        });

        // Create thread linked to subreddit
        thread = await Thread.create({
            title: "Vote Test Thread",
            content: "Testing votes",
            author: mockUser._id,
            subreddit: subreddit._id, // <-- must include
        });

        // Create a comment linked to the thread
        comment = await Comment.create({
            content: "Vote Test Comment",
            user: mockUser._id,
            thread: thread._id,
        });
    });

    // -------------------
    // THREAD VOTES
    // -------------------
    it("POST /api/threads/:id/upvote -> should upvote thread", async () => {
        const res = await request(app)
            .post(`/api/threads/${thread._id}/upvote`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Thread upvoted successfully");
        expect(res.body.data.voteCount).toBe(1);
        expect(res.body.data.upvotes).toBe(1);
        expect(res.body.data.downvotes).toBe(0);
    });

    it("POST /api/threads/:id/downvote -> should downvote thread", async () => {
        const res = await request(app)
            .post(`/api/threads/${thread._id}/downvote`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Thread downvoted successfully");
        expect(res.body.data.voteCount).toBe(-1);
        expect(res.body.data.upvotes).toBe(0);
        expect(res.body.data.downvotes).toBe(1);
    });

    // -------------------
    // COMMENT VOTES
    // -------------------
    it("POST /api/comments/:id/upvote -> should upvote comment", async () => {
        const res = await request(app)
            .post(`/api/comments/${comment._id}/upvote`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Comment upvoted successfully");
        expect(res.body.data.upvotedBy.map(id => id.toString())).toContain(mockUser._id.toString());
    });

    it("POST /api/comments/:id/downvote -> should downvote comment", async () => {
        const res = await request(app)
            .post(`/api/comments/${comment._id}/downvote`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Comment downvoted successfully");
        expect(res.body.data.downvotedBy.map(id => id.toString())).toContain(mockUser._id.toString());
    });

    // -------------------
    // ERROR CASES
    // -------------------
    it("POST /api/threads/:id/upvote -> should return 404 if thread not found", async () => {
        const fakeId = "507f1f77bcf86cd799439011";
        const res = await request(app)
            .post(`/api/threads/${fakeId}/upvote`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Item not found");
    });

    it("POST /api/comments/:id/upvote -> should return 404 if comment not found", async () => {
        const fakeId = "507f1f77bcf86cd799439011";
        const res = await request(app)
            .post(`/api/comments/${fakeId}/upvote`)
            .set("Authorization", `Bearer ${jwtToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Item not found");
    });
});