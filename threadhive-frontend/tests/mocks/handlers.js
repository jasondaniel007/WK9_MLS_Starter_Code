import { http, HttpResponse } from 'msw';
import {
  mockUsers,
  mockSubreddits,
  mockThreads,
  mockComments,
  mockAuthResponse,
} from './mockData';

const BASE_URL = 'http://localhost:3000/api';

export const handlers = [
  http.post('*/ai/rephrase', async ({ request }) => {
    const { text } = await request.json();
    return HttpResponse.json({ success: true, data: { text: `Rephrased: ${text}` } });
  }),

  http.post(`${BASE_URL}/threads/:id/summarize`, () =>
    HttpResponse.json({ success: true, data: { summary: 'Mock AI summary.' } }),
  ),

  // Auth endpoints
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'john@example.com' && body.password === 'password123') {
      return HttpResponse.json({ data: mockAuthResponse.success });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }

    return HttpResponse.json(mockAuthResponse.register);
  }),

  // Thread endpoints
  http.get(`${BASE_URL}/threads`, () => {
    return HttpResponse.json({ data: mockThreads });
  }),

  http.get(`${BASE_URL}/threads/:id`, ({ params }) => {
    const thread = mockThreads.find(t => t._id === params.id);

    if (!thread) {
      return HttpResponse.json(
        { message: 'Thread not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: thread });
  }),

  http.post(`${BASE_URL}/threads`, async ({ request }) => {
    const body = await request.json();

    const newThread = {
      _id: `thread-${Date.now()}`,
      ...body,
      author: mockUsers.user1,
      voteCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: newThread }, { status: 201 });
  }),

  http.post(`${BASE_URL}/threads/:id/upvote`, ({ params }) => {
    const thread = mockThreads.find(t => t._id === params.id);

    if (!thread) {
      return HttpResponse.json(
        { message: 'Thread not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: {
      ...thread,
      voteCount: thread.voteCount + 1,
    }});
  }),

  http.post(`${BASE_URL}/threads/:id/downvote`, ({ params }) => {
    const thread = mockThreads.find(t => t._id === params.id);

    if (!thread) {
      return HttpResponse.json(
        { message: 'Thread not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: {
      ...thread,
      voteCount: thread.voteCount - 1,
    }});
  }),

  // Comment endpoints
  http.get(`${BASE_URL}/comments/thread/:threadId`, ({ params }) => {
    const comments = mockComments.filter(c => c.thread === params.threadId);
    return HttpResponse.json({ data: comments });
  }),

  http.post(`${BASE_URL}/comments`, async ({ request }) => {
    const body = await request.json();

    const newComment = {
      _id: `comment-${Date.now()}`,
      ...body,
      user: mockUsers.user1,
      voteCount: 0,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: newComment }, { status: 201 });
  }),

  http.post(`${BASE_URL}/comments/:id/upvote`, ({ params }) => {
    const comment = mockComments.find(c => c._id === params.id);

    if (!comment) {
      return HttpResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: {
      ...comment,
      voteCount: comment.voteCount + 1,
    }});
  }),

  http.post(`${BASE_URL}/comments/:id/downvote`, ({ params }) => {
    const comment = mockComments.find(c => c._id === params.id);

    if (!comment) {
      return HttpResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: {
      ...comment,
      voteCount: comment.voteCount - 1,
    }});
  }),

  // Subreddit endpoints
  http.get(`${BASE_URL}/subreddits`, () => {
    return HttpResponse.json({ data: mockSubreddits });
  }),

  http.get(`${BASE_URL}/subreddits/:id`, ({ params }) => {
    const subreddit = mockSubreddits.find(s => s._id === params.id);

    if (!subreddit) {
      return HttpResponse.json(
        { message: 'Subreddit not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: subreddit });
  }),

  http.post(`${BASE_URL}/subreddits`, async ({ request }) => {
    const body = await request.json();

    const newSubreddit = {
      _id: `sub-${Date.now()}`,
      ...body,
      subscribers: 0,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: newSubreddit }, { status: 201 });
  }),

  // User endpoints
  http.get(`${BASE_URL}/users/:id`, ({ params }) => {
    const user = Object.values(mockUsers).find(u => u._id === params.id);

    if (!user) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: user });
  }),
];
