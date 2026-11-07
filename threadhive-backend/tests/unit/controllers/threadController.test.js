import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllThreads,
  getThreadByID,
  createThread,
  updateThread,
  deleteThread,
} from '../../../src/controllers/threadController.js';
import * as threadService from '../../../src/services/threadService.js';

// Mock the thread service
vi.mock('../../../src/services/threadService.js');

describe('threadController', () => {
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

  describe('getAllThreads', () => {
    it('should return all threads successfully', async () => {
      // Arrange
      const mockThreads = [
        { _id: 'thread1', title: 'Thread 1' },
        { _id: 'thread2', title: 'Thread 2' },
      ];

      threadService.fetchAllThreads = vi.fn().mockResolvedValue(mockThreads);

      // Act
      await getAllThreads(req, res);

      // Assert
      expect(threadService.fetchAllThreads).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Threads fetched successfully',
        data: mockThreads,
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      threadService.fetchAllThreads = vi
        .fn()
        .mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(getAllThreads(req, res)).rejects.toThrow('Service error');
    });
  });

  describe('getThreadByID', () => {
    it('should return single thread by ID', async () => {
      // Arrange
      req.params.id = 'thread123';
      const mockThread = { _id: 'thread123', title: 'Test Thread' };

      threadService.fetchThreadById = vi.fn().mockResolvedValue(mockThread);

      // Act
      await getThreadByID(req, res);

      // Assert
      expect(threadService.fetchThreadById).toHaveBeenCalledWith('thread123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thread fetched successfully',
        data: mockThread,
      });
    });

    it('should propagate 404 errors from service', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      const error = new Error('Thread not found');
      error.statusCode = 404;

      threadService.fetchThreadById = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(getThreadByID(req, res)).rejects.toMatchObject({
        message: 'Thread not found',
        statusCode: 404,
      });
    });
  });

  describe('createThread', () => {
    it('should create thread successfully', async () => {
      // Arrange
      req.body = {
        title: 'New Thread',
        content: 'Thread content',
        subreddit: 'sub123',
      };

      const mockThread = { _id: 'thread123', ...req.body, author: 'author123' };

      threadService.createNewThread = vi.fn().mockResolvedValue(mockThread);

      // Act
      await createThread(req, res);

      // Assert
      expect(threadService.createNewThread).toHaveBeenCalledWith(
        'New Thread',
        'Thread content',
        'author123',
        'sub123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thread created successfully',
        data: mockThread,
      });
    });

    it('should throw 400 if title is missing', async () => {
      // Arrange
      req.body = {
        content: 'Content',
        subreddit: 'sub123',
      };

      // Act & Assert
      await expect(createThread(req, res)).rejects.toThrow(
        'Title, content, and subreddit are required.'
      );
      await expect(createThread(req, res)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should throw 400 if content is missing', async () => {
      // Arrange
      req.body = {
        title: 'Title',
        subreddit: 'sub123',
      };

      // Act & Assert
      await expect(createThread(req, res)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should throw 400 if subreddit is missing', async () => {
      // Arrange
      req.body = {
        title: 'Title',
        content: 'Content',
      };

      // Act & Assert
      await expect(createThread(req, res)).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('updateThread', () => {
    it('should update thread successfully', async () => {
      // Arrange
      req.params.id = 'thread123';
      req.body = { title: 'Updated Title' };

      const mockUpdated = { _id: 'thread123', title: 'Updated Title' };

      threadService.updateThreadById = vi.fn().mockResolvedValue(mockUpdated);

      // Act
      await updateThread(req, res);

      // Assert
      expect(threadService.updateThreadById).toHaveBeenCalledWith('thread123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thread updated successfully',
        data: mockUpdated,
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      req.params.id = 'thread123';
      req.body = { title: 'Updated' };

      threadService.updateThreadById = vi
        .fn()
        .mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(updateThread(req, res)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteThread', () => {
    it('should delete thread successfully', async () => {
      // Arrange
      req.params.id = 'thread123';
      const mockDeleted = { _id: 'thread123', title: 'Deleted Thread' };

      threadService.deleteThreadById = vi.fn().mockResolvedValue(mockDeleted);

      // Act
      await deleteThread(req, res);

      // Assert
      expect(threadService.deleteThreadById).toHaveBeenCalledWith('thread123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thread deleted successfully',
        data: mockDeleted,
      });
    });

    it('should propagate 404 errors', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      const error = new Error('Thread not found');
      error.statusCode = 404;

      threadService.deleteThreadById = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(deleteThread(req, res)).rejects.toMatchObject({
        message: 'Thread not found',
        statusCode: 404,
      });
    });
  });
});
