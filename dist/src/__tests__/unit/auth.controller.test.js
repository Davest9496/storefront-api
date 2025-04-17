"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../../controllers/auth.controller");
const auth_service_1 = require("../../services/auth.service");
const user_entity_1 = require("../../entities/user.entity");
const error_middleware_1 = require("../../middleware/error.middleware");
// Mock the auth service
jest.mock('../../services/auth.service', () => ({
    authService: {
        signup: jest.fn(),
        login: jest.fn(),
    },
}));
describe('Auth Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let mockUser;
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
            role: user_entity_1.UserRole.CUSTOMER,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
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
            auth_service_1.authService.signup.mockResolvedValue({ user: mockUser, token: mockToken });
            // Act
            await auth_controller_1.authController.signup(mockRequest, mockResponse, mockNext);
            // Assert
            expect(auth_service_1.authService.signup).toHaveBeenCalledWith({
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
            const mockError = new error_middleware_1.AppError('Email already in use', 400);
            auth_service_1.authService.signup.mockRejectedValue(mockError);
            // Act
            await auth_controller_1.authController.signup(mockRequest, mockResponse, mockNext);
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
            auth_service_1.authService.login.mockResolvedValue({ user: mockUser, token: mockToken });
            // Act
            await auth_controller_1.authController.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(auth_service_1.authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
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
            const mockError = new error_middleware_1.AppError('Incorrect email or password', 401);
            auth_service_1.authService.login.mockRejectedValue(mockError);
            // Act
            await auth_controller_1.authController.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
    describe('getMe', () => {
        it('should return current user if authenticated', async () => {
            // Arrange
            mockRequest.user = mockUser;
            // Act
            await auth_controller_1.authController.getMe(mockRequest, mockResponse, mockNext);
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
            await auth_controller_1.authController.getMe(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                message: 'Not authorized',
            }));
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
            await auth_controller_1.authController.logout(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Logged out successfully',
            });
        });
    });
});
