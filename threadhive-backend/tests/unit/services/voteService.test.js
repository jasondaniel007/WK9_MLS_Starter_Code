import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  upvoteThreadService,
  downvoteThreadService,
  upvoteCommentService,
  downvoteCommentService,
} from '../../../src/services/voteService.js';
import Thread from '../../../src/models/Thread.js';
import Comment from '../../../src/models/Comment.js';

// Mock the models
vi.mock('../../../src/models/Thread.js');
vi.mock('../../../src/models/Comment.js');

describe('voteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upvoteThreadService', () => {
    // Success case - first upvote
    it('should upvote a thread successfully', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = 'user123';

      const mockThread = {
        _id: threadId,
        upvotedBy: [],
        downvotedBy: [],
        upvotes: 0,
        downvotes: 0,
        voteCount: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await upvoteThreadService(threadId, userId);

      // Assert
      expect(Thread.findById).toHaveBeenCalledWith(threadId);
      expect(mockThread.upvotedBy).toContain(userId);
      expect(mockThread.upvotes).toBe(1);
      expect(mockThread.voteCount).toBe(1);
      expect(result).toEqual({
        _id: threadId,
        upvotes: 1,
        downvotes: 0,
        voteCount: 1,
      });
    });

    // Edge case - user already upvoted
    it('should not upvote twice if user already upvoted', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = 'user123';

      const mockThread = {
        _id: threadId,
        upvotedBy: [userId],
        downvotedBy: [],
        upvotes: 1,
        downvotes: 0,
        voteCount: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await upvoteThreadService(threadId, userId);

      // Assert
      expect(mockThread.save).not.toHaveBeenCalled();
      expect(result.upvotes).toBe(1);
    });

    // Edge case - switching from downvote to upvote
    it('should switch from downvote to upvote', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = 'user123';

      const mockThread = {
        _id: threadId,
        upvotedBy: [],
        downvotedBy: [userId],
        upvotes: 0,
        downvotes: 1,
        voteCount: -1,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await upvoteThreadService(threadId, userId);

      // Assert
      expect(mockThread.upvotedBy).toContain(userId);
      expect(mockThread.downvotedBy).not.toContain(userId);
      expect(mockThread.upvotes).toBe(1);
      expect(mockThread.downvotes).toBe(0);
      expect(mockThread.voteCount).toBe(1);
    });

    // Error case - thread not found
    it('should throw 404 if thread not found', async () => {
      // Arrange
      Thread.findById = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(upvoteThreadService('nonexistent', 'user123')).rejects.toThrow(
        'Item not found'
      );
      await expect(upvoteThreadService('nonexistent', 'user123')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('downvoteThreadService', () => {
    // Success case - first downvote
    it('should downvote a thread successfully', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = 'user123';

      const mockThread = {
        _id: threadId,
        upvotedBy: [],
        downvotedBy: [],
        upvotes: 0,
        downvotes: 0,
        voteCount: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await downvoteThreadService(threadId, userId);

      // Assert
      expect(mockThread.downvotedBy).toContain(userId);
      expect(mockThread.downvotes).toBe(1);
      expect(mockThread.voteCount).toBe(-1);
      expect(result).toEqual({
        _id: threadId,
        upvotes: 0,
        downvotes: 1,
        voteCount: -1,
      });
    });

    // Edge case - switching from upvote to downvote
    it('should switch from upvote to downvote', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = 'user123';

      const mockThread = {
        _id: threadId,
        upvotedBy: [userId],
        downvotedBy: [],
        upvotes: 1,
        downvotes: 0,
        voteCount: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await downvoteThreadService(threadId, userId);

      // Assert
      expect(mockThread.downvotedBy).toContain(userId);
      expect(mockThread.upvotedBy).not.toContain(userId);
      expect(mockThread.upvotes).toBe(0);
      expect(mockThread.downvotes).toBe(1);
      expect(mockThread.voteCount).toBe(-1);
    });

    // Edge case - user already downvoted
    it('should not downvote twice if user already downvoted', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = 'user123';

      const mockThread = {
        _id: threadId,
        upvotedBy: [],
        downvotedBy: [userId],
        upvotes: 0,
        downvotes: 1,
        voteCount: -1,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await downvoteThreadService(threadId, userId);

      // Assert
      expect(mockThread.save).not.toHaveBeenCalled();
      expect(result.downvotes).toBe(1);
    });
  });

  describe('upvoteCommentService', () => {
    // Success case
    it('should upvote a comment successfully', async () => {
      // Arrange
      const commentId = 'comment123';
      const userId = 'user123';

      const mockComment = {
        _id: commentId,
        upvotedBy: [],
        downvotedBy: [],
        upvotes: 0,
        downvotes: 0,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockReturnThis(),
      };

      Comment.findById = vi.fn().mockResolvedValue(mockComment);

      // Act
      const result = await upvoteCommentService(commentId, userId);

      // Assert
      expect(Comment.findById).toHaveBeenCalledWith(commentId);
      expect(mockComment.upvotedBy).toContain(userId);
      expect(mockComment.populate).toHaveBeenCalledWith('user', 'name');
    });

    // Error case - comment not found
    it('should throw 404 if comment not found', async () => {
      // Arrange
      Comment.findById = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(upvoteCommentService('nonexistent', 'user123')).rejects.toThrow(
        'Item not found'
      );
    });

    // Edge case - multiple users voting
    it('should handle multiple users voting', async () => {
      // Arrange
      const commentId = 'comment123';
      const user1 = 'user1';
      const user2 = 'user2';

      const mockComment = {
        _id: commentId,
        upvotedBy: [user1],
        downvotedBy: [],
        upvotes: 1,
        downvotes: 0,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockReturnThis(),
      };

      Comment.findById = vi.fn().mockResolvedValue(mockComment);

      // Act
      await upvoteCommentService(commentId, user2);

      // Assert
      expect(mockComment.upvotedBy).toContain(user1);
      expect(mockComment.upvotedBy).toContain(user2);
      expect(mockComment.upvotes).toBe(2);
    });
  });

  describe('downvoteCommentService', () => {
    // Success case
    it('should downvote a comment successfully', async () => {
      // Arrange
      const commentId = 'comment123';
      const userId = 'user123';

      const mockComment = {
        _id: commentId,
        upvotedBy: [],
        downvotedBy: [],
        upvotes: 0,
        downvotes: 0,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockReturnThis(),
      };

      Comment.findById = vi.fn().mockResolvedValue(mockComment);

      // Act
      const result = await downvoteCommentService(commentId, userId);

      // Assert
      expect(mockComment.downvotedBy).toContain(userId);
      expect(mockComment.populate).toHaveBeenCalledWith('user', 'name');
    });

    // Edge case - vote count calculation
    it('should calculate vote count correctly', async () => {
      // Arrange
      const commentId = 'comment123';
      const userId = 'user123';

      const mockComment = {
        _id: commentId,
        upvotedBy: ['user1', 'user2'],
        downvotedBy: [],
        upvotes: 2,
        downvotes: 0,
        voteCount: 2,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockReturnThis(),
      };

      Comment.findById = vi.fn().mockResolvedValue(mockComment);

      // Act
      await downvoteCommentService(commentId, userId);

      // Assert
      expect(mockComment.upvotes).toBe(2);
      expect(mockComment.downvotes).toBe(1);
      expect(mockComment.voteCount).toBe(1); // 2 upvotes - 1 downvote
    });
  });

  describe('voteHandler edge cases', () => {
    // Edge case - ObjectId comparison
    it('should handle ObjectId string comparison correctly', async () => {
      // Arrange
      const threadId = 'thread123';
      const userId = { toString: () => 'user123' };

      const mockThread = {
        _id: threadId,
        upvotedBy: [{ toString: () => 'user123' }],
        downvotedBy: [],
        upvotes: 1,
        downvotes: 0,
        voteCount: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.findById = vi.fn().mockResolvedValue(mockThread);

      // Act
      const result = await upvoteThreadService(threadId, userId);

      // Assert
      expect(mockThread.save).not.toHaveBeenCalled();
    });

    // Failure case - database error
    it('should propagate database errors', async () => {
      // Arrange
      Thread.findById = vi.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(upvoteThreadService('thread123', 'user123')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
