import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchComments, addComment } from '../../../src/controllers/commentController.js';
import * as commentService from '../../../src/services/commentService.js';

// Mock the comment service
vi.mock('../../../src/services/commentService.js');

describe('commentController', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {},
      body: {},
      user: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('fetchComments', () => {
    it('should return comments for a thread successfully', async () => {
      // Arrange
      req.params.threadId = 'thread123';

      const mockComments = [
        { _id: 'comment1', content: 'Comment 1', user: { name: 'User 1' } },
        { _id: 'comment2', content: 'Comment 2', user: { name: 'User 2' } },
      ];

      commentService.getCommentsByThread = vi.fn().mockResolvedValue(mockComments);

      // Act
      await fetchComments(req, res);

      // Assert
      expect(commentService.getCommentsByThread).toHaveBeenCalledWith('thread123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comments fetched successfully',
        data: mockComments,
      });
    });

    it('should return empty array when no comments exist', async () => {
      // Arrange
      req.params.threadId = 'thread123';

      commentService.getCommentsByThread = vi.fn().mockResolvedValue([]);

      // Act
      await fetchComments(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comments fetched successfully',
        data: [],
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      req.params.threadId = 'thread123';

      commentService.getCommentsByThread = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(fetchComments(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('addComment', () => {
    it('should create comment successfully', async () => {
      // Arrange
      req.body = {
        thread: 'thread123',
        content: 'New comment',
      };
      req.user = { userId: 'user123' };

      const mockComment = {
        _id: 'comment123',
        thread: 'thread123',
        content: 'New comment',
        user: { _id: 'user123', name: 'Test User' },
      };

      commentService.createComment = vi.fn().mockResolvedValue(mockComment);

      // Act
      await addComment(req, res);

      // Assert
      expect(commentService.createComment).toHaveBeenCalledWith(
        'thread123',
        'user123',
        'New comment'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment created successfully',
        data: mockComment,
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      req.body = {
        thread: 'thread123',
        content: 'Comment',
      };
      req.user = { userId: 'user123' };

      const error = new Error('Comment creation failed');
      error.statusCode = 500;

      commentService.createComment = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(addComment(req, res)).rejects.toMatchObject({
        message: 'Comment creation failed',
        statusCode: 500,
      });
    });
  });
});
