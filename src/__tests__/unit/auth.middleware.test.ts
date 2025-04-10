import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { userRepository } from '../../repositories/user.repository';
import { User, UserRole } from '../../entities/user.entity';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../repositories/user.repository');
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: User;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request and response
    mockRequest = {
      headers: {},
      cookies: {},
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

    // Mock environment variable
    process.env.JWT_SECRET = 'testsecret';
  });

  it('should call next with 401 error if no token is provided', async () => {
    // Arrange & Act
    await protect(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'You are not logged in. Please log in to get access.',
      }),
    );
  });

  it('should get token from authorization header', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer validtoken',
    };

    // Mock jwt.verify to return a valid decoded token
    (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

    // Mock userRepository.findOne to return a user
    (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Act
    await protect(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockRequest.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should get token from cookies if no authorization header', async () => {
    // Arrange
    mockRequest.cookies = {
      jwt: 'cookietoken',
    };

    // Mock jwt.verify to return a valid decoded token
    (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

    // Mock userRepository.findOne to return a user
    (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Act
    await protect(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('cookietoken', 'testsecret');
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockRequest.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with 401 error if token is invalid', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer invalidtoken',
    };

    // Mock jwt.verify to throw an error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Act
    await protect(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', 'testsecret');
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid token. Please log in again.',
      }),
    );
  });

  it('should call next with 401 error if user does not exist', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer validtoken',
    };

    // Mock jwt.verify to return a valid decoded token
    (jwt.verify as jest.Mock).mockReturnValue({ id: 999 });

    // Mock userRepository.findOne to return null (user not found)
    (userRepository.findOne as jest.Mock).mockResolvedValue(null);

    // Act
    await protect(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
      }),
    );
  });

  describe('restrictTo middleware', () => {
    it('should call next with 401 error if user is not logged in', () => {
      // Arrange & Act
      const restrictToMiddleware = restrictTo(UserRole.ADMIN);
      restrictToMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'You are not logged in. Please log in to get access.',
        }),
      );
    });

    it('should call next with 403 error if user does not have required role', () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.CUSTOMER };

      // Act
      const restrictToMiddleware = restrictTo(UserRole.ADMIN);
      restrictToMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'You do not have permission to perform this action',
        }),
      );
    });

    it('should call next if user has required role', () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.ADMIN };

      // Act
      const restrictToMiddleware = restrictTo(UserRole.ADMIN);
      restrictToMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
