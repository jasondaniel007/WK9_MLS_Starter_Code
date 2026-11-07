import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, loginUser } from '../../../src/controllers/authController.js';
import * as authService from '../../../src/services/authService.js';

// Mock the auth service
vi.mock('../../../src/services/authService.js');

describe('authController', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      authService.register = vi.fn().mockResolvedValue(mockUser);

      // Act
      await registerUser(req, res);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: mockUser,
      });
    });

    it('should propagate service errors', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new Error('User already exists');
      error.statusCode = 409;

      authService.register = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(registerUser(req, res)).rejects.toMatchObject({
        message: 'User already exists',
        statusCode: 409,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      authService.register = vi.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(registerUser(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockLoginData = {
        token: 'jwt-token-here',
        userId: 'user123',
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      authService.login = vi.fn().mockResolvedValue(mockLoginData);

      // Act
      await loginUser(req, res);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockLoginData,
      });
    });

    it('should propagate 404 user not found error', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const error = new Error('User not found');
      error.statusCode = 404;

      authService.login = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(loginUser(req, res)).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
      });
    });

    it('should propagate 401 invalid credentials error', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      error.statusCode = 401;

      authService.login = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(loginUser(req, res)).rejects.toMatchObject({
        message: 'Invalid credentials',
        statusCode: 401,
      });
    });
  });
});
