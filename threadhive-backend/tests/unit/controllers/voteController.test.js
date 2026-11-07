import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  upvoteThread,
  downvoteThread,
  upvoteComment,
  downvoteComment,
} from '../../../src/controllers/voteController.js';
import * as voteService from '../../../src/services/voteService.js';

// Mock the vote service
vi.mock('../../../src/services/voteService.js');

describe('voteController', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {},
      user: { userId: 'user123' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('upvoteThread', () => {
    it('should upvote thread successfully', async () => {
      // Arrange
      req.params.id = 'thread123';

      const mockResult = {
        _id: 'thread123',
        upvotes: 1,
        downvotes: 0,
        voteCount: 1,
      };

      voteService.upvoteThreadService = vi.fn().mockResolvedValue(mockResult);

      // Act
      await upvoteThread(req, res);

      // Assert
      expect(voteService.upvoteThreadService).toHaveBeenCalledWith('thread123', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thread upvoted successfully',
        data: mockResult,
      });
    });

    it('should propagate 404 errors', async () => {
      // Arrange
      req.params.id = 'nonexistent';

      const error = new Error('Item not found');
      error.statusCode = 404;

      voteService.upvoteThreadService = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(upvoteThread(req, res)).rejects.toMatchObject({
        message: 'Item not found',
        statusCode: 404,
      });
    });
  });

  describe('downvoteThread', () => {
    it('should downvote thread successfully', async () => {
      // Arrange
      req.params.id = 'thread123';

      const mockResult = {
        _id: 'thread123',
        upvotes: 0,
        downvotes: 1,
        voteCount: -1,
      };

      voteService.downvoteThreadService = vi.fn().mockResolvedValue(mockResult);

      // Act
      await downvoteThread(req, res);

      // Assert
      expect(voteService.downvoteThreadService).toHaveBeenCalledWith('thread123', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thread downvoted successfully',
        data: mockResult,
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      req.params.id = 'thread123';

      voteService.downvoteThreadService = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(downvoteThread(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('upvoteComment', () => {
    it('should upvote comment successfully', async () => {
      // Arrange
      req.params.id = 'comment123';

      const mockResult = {
        _id: 'comment123',
        upvotedBy: ['user123'],
        downvotedBy: [],
        user: { name: 'Comment Author' },
      };

      voteService.upvoteCommentService = vi.fn().mockResolvedValue(mockResult);

      // Act
      await upvoteComment(req, res);

      // Assert
      expect(voteService.upvoteCommentService).toHaveBeenCalledWith('comment123', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment upvoted successfully',
        data: mockResult,
      });
    });

    it('should propagate 404 errors', async () => {
      // Arrange
      req.params.id = 'nonexistent';

      const error = new Error('Item not found');
      error.statusCode = 404;

      voteService.upvoteCommentService = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(upvoteComment(req, res)).rejects.toMatchObject({
        message: 'Item not found',
        statusCode: 404,
      });
    });
  });

  describe('downvoteComment', () => {
    it('should downvote comment successfully', async () => {
      // Arrange
      req.params.id = 'comment123';

      const mockResult = {
        _id: 'comment123',
        upvotedBy: [],
        downvotedBy: ['user123'],
        user: { name: 'Comment Author' },
      };

      voteService.downvoteCommentService = vi.fn().mockResolvedValue(mockResult);

      // Act
      await downvoteComment(req, res);

      // Assert
      expect(voteService.downvoteCommentService).toHaveBeenCalledWith('comment123', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment downvoted successfully',
        data: mockResult,
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      req.params.id = 'comment123';

      voteService.downvoteCommentService = vi
        .fn()
        .mockRejectedValue(new Error('Vote error'));

      // Act & Assert
      await expect(downvoteComment(req, res)).rejects.toThrow('Vote error');
    });
  });
});
