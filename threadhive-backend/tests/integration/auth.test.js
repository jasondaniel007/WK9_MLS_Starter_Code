import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Import setup to initialize MongoDB
import '../setup.js';

import app from "../../src/app.js";
import User from "../../src/models/User.js";

dotenv.config();

describe("Auth API", () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });
    // -------------------
    // REGISTER
    // -------------------
    it("POST /api/auth/register -> should register a new user", async () => {
        const userData = {
            name: "Test User",
            email: "testuser@example.com",
            password: "password123",
        };

        const res = await request(app)
            .post("/api/auth/register")
            .send(userData);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User registered successfully");
        expect(res.body.data).toHaveProperty("_id");

        // Ensure password is hashed
        const savedUser = await User.findOne({ email: userData.email });
        const isMatch = await bcrypt.compare(userData.password, savedUser.password);
        expect(isMatch).toBe(true);
    });

    it("POST /api/auth/register -> should fail if user already exists", async () => {
        const userData = {
            name: "Test User",
            email: "testuser@example.com",
            password: "password123",
        };

        await User.create(userData);

        const res = await request(app)
            .post("/api/auth/register")
            .send(userData);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User already exists");
    });

    // -------------------
    // LOGIN
    // -------------------
    it("POST /api/auth/login -> should login user and return token", async () => {
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: "Test User",
            email: "testuser@example.com",
            password: hashedPassword,
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Login successful");
        expect(res.body.data).toHaveProperty("token");
        expect(res.body.data.user).toHaveProperty("_id", user._id.toString());

        // Optional: verify JWT
        const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
        expect(decoded.userId).toBe(user._id.toString());
    });

    it("POST /api/auth/login -> should fail if user not found", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nouser@example.com", password: "password123" });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User not found");
    });

    it("POST /api/auth/login -> should fail with wrong password", async () => {
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: "Test User",
            email: "testuser@example.com",
            password: hashedPassword,
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password: "wrongpassword" });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid credentials");
    });
});