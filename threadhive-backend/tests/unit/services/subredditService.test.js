import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchAllSubreddits,
  createNewSubreddit,
  fetchSubredditWithThreads,
} from '../../../src/services/subredditService.js';
import Subreddit from '../../../src/models/Subreddit.js';
import Thread from '../../../src/models/Thread.js';

// Mock the models
vi.mock('../../../src/models/Subreddit.js');
vi.mock('../../../src/models/Thread.js');

describe('subredditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllSubreddits', () => {
    // Success case - returns subreddits
    it('should return all subreddits when they exist', async () => {
      // Arrange
      const mockSubreddits = [
        { _id: 'sub1', name: 'Tech', description: 'Technology discussions' },
        { _id: 'sub2', name: 'Gaming', description: 'Gaming community' },
      ];

      Subreddit.find = vi.fn().mockResolvedValue(mockSubreddits);

      // Act
      const result = await fetchAllSubreddits();

      // Assert
      expect(Subreddit.find).toHaveBeenCalled();
      expect(result).toEqual(mockSubreddits);
      expect(result).toHaveLength(2);
    });

    // Error case - no subreddits found
    it('should throw 404 if no subreddits exist', async () => {
      // Arrange
      Subreddit.find = vi.fn().mockResolvedValue([]);

      // Act & Assert
      await expect(fetchAllSubreddits()).rejects.toThrow('No subreddits found');
      await expect(fetchAllSubreddits()).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    // Edge case - single subreddit
    it('should return single subreddit successfully', async () => {
      // Arrange
      const mockSubreddits = [
        { _id: 'sub1', name: 'Tech', description: 'Technology discussions' },
      ];

      Subreddit.find = vi.fn().mockResolvedValue(mockSubreddits);

      // Act
      const result = await fetchAllSubreddits();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tech');
    });

    // Failure case - database error
    it('should propagate database errors', async () => {
      // Arrange
      Subreddit.find = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(fetchAllSubreddits()).rejects.toThrow('Database connection failed');
    });
  });

  describe('createNewSubreddit', () => {
    // Success case
    it('should create a new subreddit successfully', async () => {
      // Arrange
      const subredditData = {
        name: 'NewTech',
        description: 'New technology discussions',
        author: 'author123',
      };

      const mockNewSubreddit = {
        _id: 'sub123',
        ...subredditData,
        save: vi.fn().mockResolvedValue(true),
      };

      Subreddit.findOne = vi.fn().mockResolvedValue(null);
      Subreddit.mockImplementation(() => mockNewSubreddit);

      // Act
      const result = await createNewSubreddit(
        subredditData.name,
        subredditData.description,
        subredditData.author
      );

      // Assert
      expect(Subreddit.findOne).toHaveBeenCalledWith({ name: subredditData.name });
      expect(mockNewSubreddit.save).toHaveBeenCalled();
      expect(result.name).toBe(subredditData.name);
    });

    // Client error - duplicate subreddit
    it('should throw 409 if subreddit already exists', async () => {
      // Arrange
      const existingSubreddit = {
        _id: 'sub123',
        name: 'Tech',
        description: 'Existing subreddit',
      };

      Subreddit.findOne = vi.fn().mockResolvedValue(existingSubreddit);

      // Act & Assert
      await expect(
        createNewSubreddit('Tech', 'New description', 'author123')
      ).rejects.toThrow('Subreddit with this name already exists.');
      await expect(
        createNewSubreddit('Tech', 'New description', 'author123')
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    // Edge case - case sensitivity
    it('should check for exact name match (case-sensitive)', async () => {
      // Arrange
      Subreddit.findOne = vi.fn().mockResolvedValue(null);

      const mockNewSubreddit = {
        _id: 'sub123',
        name: 'tech', // lowercase
        save: vi.fn().mockResolvedValue(true),
      };

      Subreddit.mockImplementation(() => mockNewSubreddit);

      // Act
      await createNewSubreddit('tech', 'Description', 'author123');

      // Assert
      expect(Subreddit.findOne).toHaveBeenCalledWith({ name: 'tech' });
    });

    // Edge case - special characters in name
    it('should allow special characters in subreddit name', async () => {
      // Arrange
      const specialName = 'Tech_2024';

      Subreddit.findOne = vi.fn().mockResolvedValue(null);

      const mockNewSubreddit = {
        _id: 'sub123',
        name: specialName,
        save: vi.fn().mockResolvedValue(true),
      };

      Subreddit.mockImplementation(() => mockNewSubreddit);

      // Act
      const result = await createNewSubreddit(specialName, 'Description', 'author123');

      // Assert
      expect(result.name).toBe(specialName);
    });

    // Failure case - save error
    it('should propagate save errors', async () => {
      // Arrange
      Subreddit.findOne = vi.fn().mockResolvedValue(null);

      const mockNewSubreddit = {
        save: vi.fn().mockRejectedValue(new Error('Save failed')),
      };

      Subreddit.mockImplementation(() => mockNewSubreddit);

      // Act & Assert
      await expect(
        createNewSubreddit('NewTech', 'Description', 'author123')
      ).rejects.toThrow('Save failed');
    });

    // Edge case - long description
    it('should handle long descriptions', async () => {
      // Arrange
      const longDescription = 'A'.repeat(1000);

      Subreddit.findOne = vi.fn().mockResolvedValue(null);

      const mockNewSubreddit = {
        _id: 'sub123',
        name: 'LongDesc',
        description: longDescription,
        save: vi.fn().mockResolvedValue(true),
      };

      Subreddit.mockImplementation(() => mockNewSubreddit);

      // Act
      const result = await createNewSubreddit('LongDesc', longDescription, 'author123');

      // Assert
      expect(result.description).toBe(longDescription);
      expect(mockNewSubreddit.save).toHaveBeenCalled();
    });
  });

  describe('fetchSubredditWithThreads', () => {
    // Success case - subreddit with threads
    it('should return subreddit with threads', async () => {
      // Arrange
      const subredditId = 'sub123';
      const mockSubreddit = {
        _id: subredditId,
        name: 'Tech',
        description: 'Technology discussions',
      };

      const mockThreads = [
        {
          _id: 'thread1',
          title: 'Thread 1',
          author: { _id: 'user1', name: 'User 1' },
        },
        {
          _id: 'thread2',
          title: 'Thread 2',
          author: { _id: 'user2', name: 'User 2' },
        },
      ];

      Subreddit.findById = vi.fn().mockResolvedValue(mockSubreddit);

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockThreads),
        }),
      });

      Thread.find = mockFind;

      // Act
      const result = await fetchSubredditWithThreads(subredditId);

      // Assert
      expect(Subreddit.findById).toHaveBeenCalledWith(subredditId);
      expect(Thread.find).toHaveBeenCalledWith({ subreddit: subredditId });
      expect(result).toEqual({
        subreddit: mockSubreddit,
        threads: mockThreads,
      });
      expect(result.threads).toHaveLength(2);
    });

    // Success case - subreddit with no threads
    it('should return subreddit with empty threads array', async () => {
      // Arrange
      const subredditId = 'sub123';
      const mockSubreddit = {
        _id: subredditId,
        name: 'EmptyTech',
        description: 'No threads yet',
      };

      Subreddit.findById = vi.fn().mockResolvedValue(mockSubreddit);

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([]),
        }),
      });

      Thread.find = mockFind;

      // Act
      const result = await fetchSubredditWithThreads(subredditId);

      // Assert
      expect(result.subreddit).toEqual(mockSubreddit);
      expect(result.threads).toEqual([]);
    });

    // Error case - subreddit not found
    it('should throw 404 if subreddit not found', async () => {
      // Arrange
      Subreddit.findById = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(fetchSubredditWithThreads('nonexistent')).rejects.toThrow(
        'Subreddit not found'
      );
      await expect(fetchSubredditWithThreads('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    // Edge case - threads sorted by createdAt
    it('should sort threads by createdAt descending', async () => {
      // Arrange
      const subredditId = 'sub123';
      const mockSubreddit = { _id: subredditId, name: 'Tech' };

      const sortSpy = vi.fn().mockResolvedValue([]);

      Subreddit.findById = vi.fn().mockResolvedValue(mockSubreddit);
      Thread.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: sortSpy,
        }),
      });

      // Act
      await fetchSubredditWithThreads(subredditId);

      // Assert
      expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
    });

    // Edge case - threads are populated with author
    it('should populate thread authors', async () => {
      // Arrange
      const subredditId = 'sub123';
      const mockSubreddit = { _id: subredditId, name: 'Tech' };

      const populateSpy = vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      Subreddit.findById = vi.fn().mockResolvedValue(mockSubreddit);
      Thread.find = vi.fn().mockReturnValue({
        populate: populateSpy,
      });

      // Act
      await fetchSubredditWithThreads(subredditId);

      // Assert
      expect(populateSpy).toHaveBeenCalledWith('author');
    });

    // Failure case - database error during thread fetch
    it('should propagate errors when fetching threads', async () => {
      // Arrange
      const mockSubreddit = { _id: 'sub123', name: 'Tech' };

      Subreddit.findById = vi.fn().mockResolvedValue(mockSubreddit);
      Thread.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockRejectedValue(new Error('Thread fetch error')),
        }),
      });

      // Act & Assert
      await expect(fetchSubredditWithThreads('sub123')).rejects.toThrow('Thread fetch error');
    });

    // Edge case - invalid ObjectId format
    it('should handle invalid ObjectId format', async () => {
      // Arrange
      Subreddit.findById = vi
        .fn()
        .mockRejectedValue(new Error('Cast to ObjectId failed'));

      // Act & Assert
      await expect(fetchSubredditWithThreads('invalid-id')).rejects.toThrow();
    });
  });
});
