import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCommentsByThread,
  createComment,
} from '../../../src/services/commentService.js';
import Comment from '../../../src/models/Comment.js';

// Mock the Comment model
vi.mock('../../../src/models/Comment.js');

describe('commentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCommentsByThread', () => {
    // Success case - returns comments
    it('should return all comments for a thread', async () => {
      // Arrange
      const threadId = 'thread123';
      const mockComments = [
        {
          _id: 'comment1',
          content: 'First comment',
          user: { _id: 'user1', name: 'User 1' },
        },
        {
          _id: 'comment2',
          content: 'Second comment',
          user: { _id: 'user2', name: 'User 2' },
        },
      ];

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockComments),
      });

      Comment.find = mockFind;

      // Act
      const result = await getCommentsByThread(threadId);

      // Assert
      expect(Comment.find).toHaveBeenCalledWith({ thread: threadId });
      expect(result).toEqual(mockComments);
      expect(result).toHaveLength(2);
    });

    // Edge case - no comments (returns empty array)
    it('should return empty array when no comments exist', async () => {
      // Arrange
      const threadId = 'thread123';

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      Comment.find = mockFind;

      // Act
      const result = await getCommentsByThread(threadId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    // Edge case - user field is populated
    it('should populate user field with name only', async () => {
      // Arrange
      const threadId = 'thread123';
      const populateSpy = vi.fn().mockResolvedValue([]);

      Comment.find = vi.fn().mockReturnValue({
        populate: populateSpy,
      });

      // Act
      await getCommentsByThread(threadId);

      // Assert
      expect(populateSpy).toHaveBeenCalledWith('user', 'name');
    });

    // Edge case - single comment
    it('should return single comment successfully', async () => {
      // Arrange
      const threadId = 'thread123';
      const mockComments = [
        {
          _id: 'comment1',
          content: 'Only comment',
          user: { _id: 'user1', name: 'User 1' },
        },
      ];

      Comment.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockComments),
      });

      // Act
      const result = await getCommentsByThread(threadId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Only comment');
    });

    // Failure case - database error
    it('should propagate database errors', async () => {
      // Arrange
      Comment.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      // Act & Assert
      await expect(getCommentsByThread('thread123')).rejects.toThrow('Database error');
    });

    // Edge case - invalid threadId format
    it('should handle invalid threadId', async () => {
      // Arrange
      Comment.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error('Cast to ObjectId failed')),
      });

      // Act & Assert
      await expect(getCommentsByThread('invalid-id')).rejects.toThrow();
    });
  });

  describe('createComment', () => {
    // Success case
    it('should create a comment successfully', async () => {
      // Arrange
      const commentData = {
        thread: 'thread123',
        userId: 'user123',
        content: 'This is a test comment',
      };

      const mockCreatedComment = {
        _id: 'comment123',
        thread: commentData.thread,
        user: commentData.userId,
        content: commentData.content,
      };

      const mockPopulatedComment = {
        ...mockCreatedComment,
        user: { _id: 'user123', name: 'Test User' },
      };

      Comment.create = vi.fn().mockResolvedValue(mockCreatedComment);
      Comment.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockPopulatedComment),
      });

      // Act
      const result = await createComment(
        commentData.thread,
        commentData.userId,
        commentData.content
      );

      // Assert
      expect(Comment.create).toHaveBeenCalledWith({
        thread: commentData.thread,
        user: commentData.userId,
        content: commentData.content,
      });
      expect(Comment.findById).toHaveBeenCalledWith('comment123');
      expect(result).toEqual(mockPopulatedComment);
      expect(result.user).toHaveProperty('name', 'Test User');
    });

    // Error case - comment creation failed (populated comment not found)
    it('should throw 500 if populated comment is not found', async () => {
      // Arrange
      const mockCreatedComment = {
        _id: 'comment123',
        thread: 'thread123',
        user: 'user123',
        content: 'Test comment',
      };

      Comment.create = vi.fn().mockResolvedValue(mockCreatedComment);
      Comment.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(createComment('thread123', 'user123', 'Test')).rejects.toThrow(
        'Comment creation failed'
      );
      await expect(createComment('thread123', 'user123', 'Test')).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    // Edge case - long content
    it('should handle long comment content', async () => {
      // Arrange
      const longContent = 'A'.repeat(5000);

      const mockCreatedComment = {
        _id: 'comment123',
        content: longContent,
      };

      const mockPopulatedComment = {
        ...mockCreatedComment,
        user: { _id: 'user123', name: 'Test User' },
      };

      Comment.create = vi.fn().mockResolvedValue(mockCreatedComment);
      Comment.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockPopulatedComment),
      });

      // Act
      const result = await createComment('thread123', 'user123', longContent);

      // Assert
      expect(result.content).toBe(longContent);
    });

    // Edge case - special characters in content
    it('should handle special characters in content', async () => {
      // Arrange
      const specialContent = 'Comment with <html>, "quotes", & special chars!';

      const mockCreatedComment = {
        _id: 'comment123',
        content: specialContent,
      };

      const mockPopulatedComment = {
        ...mockCreatedComment,
        user: { _id: 'user123', name: 'Test User' },
      };

      Comment.create = vi.fn().mockResolvedValue(mockCreatedComment);
      Comment.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockPopulatedComment),
      });

      // Act
      const result = await createComment('thread123', 'user123', specialContent);

      // Assert
      expect(result.content).toBe(specialContent);
    });

    // Failure case - database error during create
    it('should propagate database errors during creation', async () => {
      // Arrange
      Comment.create = vi.fn().mockRejectedValue(new Error('Create failed'));

      // Act & Assert
      await expect(createComment('thread123', 'user123', 'Test')).rejects.toThrow(
        'Create failed'
      );
    });

    // Failure case - populate error
    it('should propagate errors during population', async () => {
      // Arrange
      Comment.create = vi.fn().mockResolvedValue({ _id: 'comment123' });
      Comment.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error('Populate failed')),
      });

      // Act & Assert
      await expect(createComment('thread123', 'user123', 'Test')).rejects.toThrow(
        'Populate failed'
      );
    });

    // Edge case - user field populated correctly
    it('should populate user field with name only', async () => {
      // Arrange
      const mockCreatedComment = { _id: 'comment123' };
      const populateSpy = vi.fn().mockResolvedValue({
        _id: 'comment123',
        user: { _id: 'user123', name: 'Test User' },
      });

      Comment.create = vi.fn().mockResolvedValue(mockCreatedComment);
      Comment.findById = vi.fn().mockReturnValue({
        populate: populateSpy,
      });

      // Act
      await createComment('thread123', 'user123', 'Test');

      // Assert
      expect(populateSpy).toHaveBeenCalledWith('user', 'name');
    });

    // Edge case - empty content
    it('should handle empty content string', async () => {
      // Arrange
      const mockCreatedComment = {
        _id: 'comment123',
        content: '',
      };

      const mockPopulatedComment = {
        ...mockCreatedComment,
        user: { _id: 'user123', name: 'Test User' },
      };

      Comment.create = vi.fn().mockResolvedValue(mockCreatedComment);
      Comment.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockPopulatedComment),
      });

      // Act
      const result = await createComment('thread123', 'user123', '');

      // Assert
      expect(result.content).toBe('');
    });
  });
});
