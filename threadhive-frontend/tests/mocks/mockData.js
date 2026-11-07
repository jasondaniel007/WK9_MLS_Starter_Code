// Mock data for testing

export const mockUsers = {
  user1: {
    _id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer',
    location: 'New York',
    website: 'https://johndoe.com',
  },
  user2: {
    _id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: 'Designer',
    location: 'San Francisco',
  },
};

export const mockSubreddits = [
  {
    _id: 'sub-1',
    name: 'JavaScript',
    description: 'All about JavaScript programming',
    author: 'user-1',
    subscribers: 1500,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'sub-2',
    name: 'Python',
    description: 'Python programming community',
    author: 'user-2',
    subscribers: 2000,
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    _id: 'sub-3',
    name: 'React',
    description: 'React.js discussions',
    author: 'user-1',
    subscribers: 1800,
    createdAt: '2024-01-03T00:00:00.000Z',
  },
];

export const mockThreads = [
  {
    _id: 'thread-1',
    title: 'Getting Started with React',
    content: 'How do I start learning React?',
    author: mockUsers.user1,
    subreddit: mockSubreddits[2],
    voteCount: 15,
    commentCount: 5,
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    _id: 'thread-2',
    title: 'JavaScript Tips and Tricks',
    content: 'Share your favorite JS tips',
    author: mockUsers.user2,
    subreddit: mockSubreddits[0],
    voteCount: 25,
    commentCount: 10,
    createdAt: '2024-01-11T12:00:00.000Z',
  },
  {
    _id: 'thread-3',
    title: 'Python vs JavaScript',
    content: 'Which one should I learn first?',
    author: mockUsers.user1,
    subreddit: mockSubreddits[1],
    voteCount: 8,
    commentCount: 3,
    createdAt: '2024-01-12T14:00:00.000Z',
  },
];

export const mockComments = [
  {
    _id: 'comment-1',
    content: 'Great question! Start with the official docs.',
    user: mockUsers.user2,
    thread: 'thread-1',
    voteCount: 5,
    createdAt: '2024-01-10T11:00:00.000Z',
  },
  {
    _id: 'comment-2',
    content: 'I recommend watching tutorials on YouTube.',
    user: mockUsers.user1,
    thread: 'thread-1',
    voteCount: 3,
    createdAt: '2024-01-10T12:00:00.000Z',
  },
  {
    _id: 'comment-3',
    content: 'Use arrow functions for cleaner code.',
    user: mockUsers.user1,
    thread: 'thread-2',
    voteCount: 10,
    createdAt: '2024-01-11T13:00:00.000Z',
  },
];

export const mockAuthResponse = {
  success: {
    token: 'mock-jwt-token-12345',
    user: mockUsers.user1,
    message: 'Login successful',
  },
  register: {
    message: 'User registered successfully',
    user: mockUsers.user1,
  },
};
