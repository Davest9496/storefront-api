import { Request, Response } from 'express';
import { signup, login, getCurrentUser } from '../../controllers/auth.controller';
import { userRepository } from '../../repositories/user.repository';
import * as passwordUtils from '../../utils/password.utils';
import * as jwtUtils from '../../utils/jwt.utils';
import { User } from '../../entities/user.entity';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../utils/password.utils');
jest.mock('../../utils/jwt.utils');
jest.mock('class-validator', () => ({
  validate: jest.fn().mockResolvedValue([]),
}));

describe('Auth Controller - signup', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        passwordConfirm: 'TestPassword123!',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Mock function implementations
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashedpassword');
    (jwtUtils.generateToken as jest.Mock).mockReturnValue('mocktoken');
    (userRepository.save as jest.Mock).mockImplementation((user) =>
      Promise.resolve({
        id: 1,
        ...user,
      }),
    );
  });

  it('should create a new user and return a token', async () => {
    // Arrange - all setup in beforeEach

    // Act
    await signup(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(passwordUtils.hashPassword).toHaveBeenCalledWith('TestPassword123!');
    expect(userRepository.save).toHaveBeenCalled();
    expect(jwtUtils.generateToken).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        token: 'mocktoken',
      }),
    );
  });

  it('should return error if user already exists', async () => {
    // Arrange
    (userRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    // Act
    await signup(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Email already in use',
      }),
    );
  });
});

describe('Auth Controller - login', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {
        email: 'test@example.com',
        password: 'TestPassword123!',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Mock function implementations
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      passwordDigest: 'hashedpassword',
    });
    (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
    (jwtUtils.generateToken as jest.Mock).mockReturnValue('mocktoken');
  });

  it('should login user successfully with valid credentials', async () => {
    // Arrange - all setup in beforeEach

    // Act
    await login(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
    expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
      'TestPassword123!',
      'hashedpassword',
    );
    expect(jwtUtils.generateToken).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        token: 'mocktoken',
      }),
    );
  });

  it('should return error with invalid credentials', async () => {
    // Arrange
    (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

    // Act
    await login(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Incorrect email or password',
      }),
    );
  });

  it('should return error if user not found', async () => {
    // Arrange
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(null);

    // Act
    await login(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Incorrect email or password',
      }),
    );
  });
});

describe('Auth Controller - getCurrentUser', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      } as User,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('should return the current user profile', async () => {
    // Arrange - all setup in beforeEach

    // Act
    await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        user: mockRequest.user,
      },
    });
  });

  it('should return error if user not found in request', async () => {
    // Arrange
    mockRequest.user = undefined;

    // Act
    await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'User not found',
      }),
    );
  });
});
