import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchAllThreads,
  fetchThreadById,
  createNewThread,
  updateThreadById,
  deleteThreadById,
} from '../../../src/services/threadService.js';
import Thread from '../../../src/models/Thread.js';

// Mock the Thread model
vi.mock('../../../src/models/Thread.js');

describe('threadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllThreads', () => {
    it('should return all threads with populated fields', async () => {
      // Arrange
      const mockThreads = [
        {
          _id: 'thread1',
          title: 'Thread 1',
          content: 'Content 1',
          author: { _id: 'user1', name: 'User 1' },
          subreddit: { _id: 'sub1', name: 'Subreddit 1' },
          createdAt: new Date(),
        },
      ];

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue(mockThreads),
          }),
        }),
      });

      Thread.find = mockFind;

      // Act
      const result = await fetchAllThreads();

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual(mockThreads);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no threads exist', async () => {
      // Arrange
      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      Thread.find = mockFind;

      // Act
      const result = await fetchAllThreads();

      // Assert
      expect(result).toEqual([]);
    });

    it('should sort threads by createdAt descending', async () => {
      // Arrange
      const sortSpy = vi.fn().mockResolvedValue([]);

      Thread.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: sortSpy,
          }),
        }),
      });

      // Act
      await fetchAllThreads();

      // Assert
      expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('fetchThreadById', () => {
    it('should return thread by id with populated fields', async () => {
      // Arrange
      const mockThread = {
        _id: 'thread123',
        title: 'Test Thread',
        content: 'Test Content',
        author: { _id: 'user1', name: 'User 1' },
      };

      Thread.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockThread),
        }),
      });

      // Act
      const result = await fetchThreadById('thread123');

      // Assert
      expect(Thread.findById).toHaveBeenCalledWith('thread123');
      expect(result).toEqual(mockThread);
    });

    it('should throw 404 error if thread not found', async () => {
      // Arrange
      Thread.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(fetchThreadById('nonexistent')).rejects.toThrow('Thread not found');
      await expect(fetchThreadById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      Thread.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockRejectedValue(new Error('Cast to ObjectId failed')),
        }),
      });

      // Act & Assert
      await expect(fetchThreadById('invalid-id')).rejects.toThrow();
    });
  });

  describe('createNewThread', () => {
    it('should create and return populated thread', async () => {
      // Arrange
      const threadData = {
        title: 'New Thread',
        content: 'Thread content',
        author: 'user123',
        subreddit: 'sub123',
      };

      const mockNewThread = {
        _id: 'thread123',
        ...threadData,
        save: vi.fn().mockResolvedValue(true),
      };

      const mockPopulatedThread = {
        _id: 'thread123',
        ...threadData,
        author: { _id: 'user123', name: 'User Name' },
        subreddit: { _id: 'sub123', name: 'Subreddit Name' },
      };

      Thread.mockImplementation(() => mockNewThread);

      Thread.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockPopulatedThread),
        }),
      });

      // Act
      const result = await createNewThread(
        threadData.title,
        threadData.content,
        threadData.author,
        threadData.subreddit
      );

      // Assert
      expect(mockNewThread.save).toHaveBeenCalled();
      expect(result).toEqual(mockPopulatedThread);
      expect(result.author).toHaveProperty('name');
      expect(result.subreddit).toHaveProperty('name');
    });

    it('should throw 500 error if thread creation fails', async () => {
      // Arrange
      const mockNewThread = {
        _id: 'thread123',
        save: vi.fn().mockResolvedValue(true),
      };

      Thread.mockImplementation(() => mockNewThread);

      Thread.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(
        createNewThread('Title', 'Content', 'author123', 'sub123')
      ).rejects.toThrow('Failed to create thread');
    });
  });

  describe('updateThreadById', () => {
    it('should update and return thread', async () => {
      // Arrange
      const updateData = { title: 'Updated Title', content: 'Updated Content' };
      const mockUpdatedThread = {
        _id: 'thread123',
        ...updateData,
      };

      Thread.findByIdAndUpdate = vi.fn().mockResolvedValue(mockUpdatedThread);

      // Act
      const result = await updateThreadById('thread123', updateData);

      // Assert
      expect(Thread.findByIdAndUpdate).toHaveBeenCalledWith('thread123', updateData, {
        new: true,
        runValidators: true,
      });
      expect(result).toEqual(mockUpdatedThread);
    });

    it('should throw 404 if thread not found during update', async () => {
      // Arrange
      Thread.findByIdAndUpdate = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(updateThreadById('nonexistent', {})).rejects.toThrow('Thread not found');
      await expect(updateThreadById('nonexistent', {})).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should run validators during update', async () => {
      // Arrange
      const updateSpy = vi.fn().mockResolvedValue({ _id: 'thread123' });
      Thread.findByIdAndUpdate = updateSpy;

      // Act
      await updateThreadById('thread123', { title: 'New Title' });

      // Assert
      expect(updateSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ runValidators: true })
      );
    });
  });

  describe('deleteThreadById', () => {
    it('should delete and return thread', async () => {
      // Arrange
      const mockDeletedThread = {
        _id: 'thread123',
        title: 'Deleted Thread',
      };

      Thread.findByIdAndDelete = vi.fn().mockResolvedValue(mockDeletedThread);

      // Act
      const result = await deleteThreadById('thread123');

      // Assert
      expect(Thread.findByIdAndDelete).toHaveBeenCalledWith('thread123');
      expect(result).toEqual(mockDeletedThread);
    });

    it('should throw 404 if thread not found during delete', async () => {
      // Arrange
      Thread.findByIdAndDelete = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(deleteThreadById('nonexistent')).rejects.toThrow('Thread not found');
      await expect(deleteThreadById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
