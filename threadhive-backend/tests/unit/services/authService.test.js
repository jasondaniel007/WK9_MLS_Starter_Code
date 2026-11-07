import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login } from '../../../src/services/authService.js';
import User from '../../../src/models/User.js';

// Mock the User model
vi.mock('../../../src/models/User.js');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    // Success case
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      User.findOne = vi.fn().mockResolvedValue(null);
      const mockUser = {
        _id: 'user123',
        name: userData.name,
        email: userData.email,
        password: 'hashedPassword',
      };
      mockUser.toObject = vi.fn().mockReturnValue({ ...mockUser });
      User.create = vi.fn().mockResolvedValue(mockUser);

      // Act
      const result = await register(userData);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: expect.any(String), // hashed password
      });
      expect(result).toHaveProperty('_id', 'user123');
      expect(result.email).toBe(userData.email);
    });

    // Client error - duplicate user
    it('should throw error if user already exists', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      User.findOne = vi.fn().mockResolvedValue({ email: userData.email });

      // Act & Assert
      await expect(register(userData)).rejects.toThrow('User already exists');
      expect(User.create).not.toHaveBeenCalled();
    });

    // Edge case - password hashing
    it('should hash the password before saving', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plainPassword',
      };

      User.findOne = vi.fn().mockResolvedValue(null);
      User.create = vi.fn().mockImplementation(async (data) => {
        // Verify password is hashed
        const isPlainPassword = data.password === 'plainPassword';
        expect(isPlainPassword).toBe(false);
        const user = { _id: 'user123', ...data };
        user.toObject = vi.fn().mockReturnValue({ ...user });
        return user;
      });

      // Act
      await register(userData);

      // Assert
      expect(User.create).toHaveBeenCalled();
    });

    // Failure case - database error
    it('should propagate database errors', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      User.findOne = vi.fn().mockResolvedValue(null);
      User.create = vi.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(register(userData)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    // Success case
    it('should login user and return token', async () => {
      // Arrange
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: loginData.email,
        password: await bcrypt.hash(loginData.password, 10),
      };

      User.findOne = vi.fn().mockResolvedValue(mockUser);

      // Act
      const result = await login(loginData);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('_id', mockUser._id);

      // Verify JWT token
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(mockUser._id);
    });

    // Client error - user not found
    it('should throw 404 error if user not found', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      User.findOne = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(login(loginData)).rejects.toThrow('User not found');
      await expect(login(loginData)).rejects.toMatchObject({ statusCode: 404 });
    });

    // Client error - invalid password
    it('should throw 401 error if password is incorrect', async () => {
      // Arrange
      const loginData = {
        email: 'john@example.com',
        password: 'wrongPassword',
      };

      const mockUser = {
        _id: 'user123',
        email: loginData.email,
        password: await bcrypt.hash('correctPassword', 10),
      };

      User.findOne = vi.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(login(loginData)).rejects.toThrow('Invalid credentials');
      await expect(login(loginData)).rejects.toMatchObject({ statusCode: 401 });
    });

    // Edge case - JWT token expiration
    it('should set token expiration to 1 day', async () => {
      // Arrange
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: loginData.email,
        password: await bcrypt.hash(loginData.password, 10),
      };

      User.findOne = vi.fn().mockResolvedValue(mockUser);

      // Act
      const result = await login(loginData);

      // Assert
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(86400); // 1 day in seconds
    });

    // Failure case - database error
    it('should propagate database errors during login', async () => {
      // Arrange
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      User.findOne = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(login(loginData)).rejects.toThrow('Database connection failed');
    });
  });
});
