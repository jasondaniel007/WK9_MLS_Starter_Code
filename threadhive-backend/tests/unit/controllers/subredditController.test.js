import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllSubreddits,
  createSubreddit,
  getSubredditWithThreads,
} from '../../../src/controllers/subredditController.js';
import * as subredditService from '../../../src/services/subredditService.js';

// Mock the subreddit service
vi.mock('../../../src/services/subredditService.js');

describe('subredditController', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {},
      body: {},
      user: { userId: 'author123' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getAllSubreddits', () => {
    it('should return all subreddits successfully', async () => {
      // Arrange
      const mockSubreddits = [
        { _id: 'sub1', name: 'Tech' },
        { _id: 'sub2', name: 'Gaming' },
      ];

      subredditService.fetchAllSubreddits = vi.fn().mockResolvedValue(mockSubreddits);

      // Act
      await getAllSubreddits(req, res);

      // Assert
      expect(subredditService.fetchAllSubreddits).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subreddits fetched successfully',
        data: mockSubreddits,
      });
    });

    it('should propagate 404 from service', async () => {
      // Arrange
      const error = new Error('No subreddits found');
      error.statusCode = 404;

      subredditService.fetchAllSubreddits = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(getAllSubreddits(req, res)).rejects.toMatchObject({
        message: 'No subreddits found',
        statusCode: 404,
      });
    });
  });

  describe('createSubreddit', () => {
    it('should create subreddit successfully', async () => {
      // Arrange
      req.body = {
        name: 'NewTech',
        description: 'Tech discussions',
      };

      const mockSubreddit = { _id: 'sub123', ...req.body, author: 'author123' };

      subredditService.createNewSubreddit = vi.fn().mockResolvedValue(mockSubreddit);

      // Act
      await createSubreddit(req, res);

      // Assert
      expect(subredditService.createNewSubreddit).toHaveBeenCalledWith(
        'NewTech',
        'Tech discussions',
        'author123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subreddit created successfully',
        data: mockSubreddit,
      });
    });

    it('should throw 400 if name is missing', async () => {
      // Arrange
      req.body = {
        description: 'Description',
      };

      // Act & Assert
      await expect(createSubreddit(req, res)).rejects.toThrow(
        'Name and description are required.'
      );
      await expect(createSubreddit(req, res)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should throw 400 if description is missing', async () => {
      // Arrange
      req.body = {
        name: 'Tech',
      };

      // Act & Assert
      await expect(createSubreddit(req, res)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should propagate 409 conflict error from service', async () => {
      // Arrange
      req.body = {
        name: 'Existing',
        description: 'Description',
      };

      const error = new Error('Subreddit with this name already exists.');
      error.statusCode = 409;

      subredditService.createNewSubreddit = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(createSubreddit(req, res)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('getSubredditWithThreads', () => {
    it('should return subreddit with threads successfully', async () => {
      // Arrange
      req.params.id = 'sub123';

      const mockData = {
        subreddit: { _id: 'sub123', name: 'Tech' },
        threads: [
          { _id: 'thread1', title: 'Thread 1' },
          { _id: 'thread2', title: 'Thread 2' },
        ],
      };

      subredditService.fetchSubredditWithThreads = vi.fn().mockResolvedValue(mockData);

      // Act
      await getSubredditWithThreads(req, res);

      // Assert
      expect(subredditService.fetchSubredditWithThreads).toHaveBeenCalledWith('sub123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subreddit and its threads fetched successfully',
        data: mockData,
      });
    });

    it('should propagate 404 from service', async () => {
      // Arrange
      req.params.id = 'nonexistent';

      const error = new Error('Subreddit not found');
      error.statusCode = 404;

      subredditService.fetchSubredditWithThreads = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(getSubredditWithThreads(req, res)).rejects.toMatchObject({
        message: 'Subreddit not found',
        statusCode: 404,
      });
    });
  });
});
