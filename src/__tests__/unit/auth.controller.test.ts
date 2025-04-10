import { Request, Response, NextFunction } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authService } from '../../services/auth.service';
import { User, UserRole } from '../../entities/user.entity';
import { AppError } from '../../middleware/error.middleware';

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
  authService: {
    signup: jest.fn(),
    login: jest.fn(),
  },
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: User;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request and response
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Create a mock user
    mockUser = {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      passwordDigest: 'hashedpassword',
      role: UserRole.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  });

  describe('signup', () => {
    it('should register a new user and return 201', async () => {
      // Arrange
      mockRequest.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockToken = 'mockjwttoken';
      (authService.signup as jest.Mock).mockResolvedValue({ user: mockUser, token: mockToken });

      // Act
      await authController.signup(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(authService.signup).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        token: mockToken,
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
        },
      });
    });

    it('should call next with error if signup fails', async () => {
      // Arrange
      const mockError = new AppError('Email already in use', 400);
      (authService.signup as jest.Mock).mockRejectedValue(mockError);

      // Act
      await authController.signup(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('login', () => {
    it('should login user and return 200 with token', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockToken = 'mockjwttoken';
      (authService.login as jest.Mock).mockResolvedValue({ user: mockUser, token: mockToken });

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        token: mockToken,
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
        },
      });
    });

    it('should call next with error if login fails', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockError = new AppError('Incorrect email or password', 401);
      (authService.login as jest.Mock).mockRejectedValue(mockError);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getMe', () => {
    it('should return current user if authenticated', async () => {
      // Arrange
      mockRequest.user = mockUser;

      // Act
      await authController.getMe(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
        },
      });
    });

    it('should call next with error if user is not authenticated', async () => {
      // Act
      await authController.getMe(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Not authorized',
        }),
      );
    });
  });

  describe('logout', () => {
    it('should clear JWT cookie and return success message', async () => {
      // Arrange
      mockRequest.cookies = {
        jwt: 'token',
      };

      mockResponse.cookie = jest.fn();

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Logged out successfully',
      });
    });
  });
});
