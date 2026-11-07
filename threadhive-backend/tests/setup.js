import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Thread from '../src/models/Thread.js';
import Subreddit from '../src/models/Subreddit.js';

let mongoServer;

// Run once before all tests
beforeAll(async () => {
    // Increase timeout for slow MongoDB startup
    mongoServer = await MongoMemoryServer.create({
        instance: {
            launchTimeout: 60000, // 60 seconds
        },
    });
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);

    console.log('In-memory MongoDB connected for tests');
    await Promise.all([Thread.deleteMany({}), Subreddit.deleteMany({})]);
}, 60000); // 60 second timeout for beforeAll hook

// Disconnect and stop server after all tests
afterAll(async () => {
    await Promise.all([Thread.deleteMany({}), Subreddit.deleteMany({})]);
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('In-memory MongoDB stopped');
}, 30000); // 30 second timeout for afterAll hook
