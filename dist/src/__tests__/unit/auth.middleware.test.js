"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const user_repository_1 = require("../../repositories/user.repository");
const user_entity_1 = require("../../entities/user.entity");
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
    let mockRequest;
    let mockResponse;
    let mockNext;
    let mockUser;
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
            role: user_entity_1.UserRole.CUSTOMER,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Mock environment variable
        process.env.JWT_SECRET = 'testsecret';
    });
    it('should call next with 401 error if no token is provided', async () => {
        // Arrange & Act
        await (0, auth_middleware_1.protect)(mockRequest, mockResponse, mockNext);
        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 401,
            message: 'You are not logged in. Please log in to get access.',
        }));
    });
    it('should get token from authorization header', async () => {
        // Arrange
        mockRequest.headers = {
            authorization: 'Bearer validtoken',
        };
        // Mock jwt.verify to return a valid decoded token
        jsonwebtoken_1.default.verify.mockReturnValue({ id: 1 });
        // Mock userRepository.findOne to return a user
        user_repository_1.userRepository.findOne.mockResolvedValue(mockUser);
        // Act
        await (0, auth_middleware_1.protect)(mockRequest, mockResponse, mockNext);
        // Assert
        expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
        expect(user_repository_1.userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(mockRequest.user).toEqual(mockUser);
        expect(mockNext).toHaveBeenCalledWith();
    });
    it('should get token from cookies if no authorization header', async () => {
        // Arrange
        mockRequest.cookies = {
            jwt: 'cookietoken',
        };
        // Mock jwt.verify to return a valid decoded token
        jsonwebtoken_1.default.verify.mockReturnValue({ id: 1 });
        // Mock userRepository.findOne to return a user
        user_repository_1.userRepository.findOne.mockResolvedValue(mockUser);
        // Act
        await (0, auth_middleware_1.protect)(mockRequest, mockResponse, mockNext);
        // Assert
        expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('cookietoken', 'testsecret');
        expect(user_repository_1.userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(mockRequest.user).toEqual(mockUser);
        expect(mockNext).toHaveBeenCalledWith();
    });
    it('should call next with 401 error if token is invalid', async () => {
        // Arrange
        mockRequest.headers = {
            authorization: 'Bearer invalidtoken',
        };
        // Mock jwt.verify to throw an error
        jsonwebtoken_1.default.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });
        // Act
        await (0, auth_middleware_1.protect)(mockRequest, mockResponse, mockNext);
        // Assert
        expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('invalidtoken', 'testsecret');
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 401,
            message: 'Invalid token. Please log in again.',
        }));
    });
    it('should call next with 401 error if user does not exist', async () => {
        // Arrange
        mockRequest.headers = {
            authorization: 'Bearer validtoken',
        };
        // Mock jwt.verify to return a valid decoded token
        jsonwebtoken_1.default.verify.mockReturnValue({ id: 999 });
        // Mock userRepository.findOne to return null (user not found)
        user_repository_1.userRepository.findOne.mockResolvedValue(null);
        // Act
        await (0, auth_middleware_1.protect)(mockRequest, mockResponse, mockNext);
        // Assert
        expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
        expect(user_repository_1.userRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 401,
            message: 'The user belonging to this token no longer exists.',
        }));
    });
    describe('restrictTo middleware', () => {
        it('should call next with 401 error if user is not logged in', () => {
            // Arrange & Act
            const restrictToMiddleware = (0, auth_middleware_1.restrictTo)(user_entity_1.UserRole.ADMIN);
            restrictToMiddleware(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                message: 'You are not logged in. Please log in to get access.',
            }));
        });
        it('should call next with 403 error if user does not have required role', () => {
            // Arrange
            mockRequest.user = { ...mockUser, role: user_entity_1.UserRole.CUSTOMER };
            // Act
            const restrictToMiddleware = (0, auth_middleware_1.restrictTo)(user_entity_1.UserRole.ADMIN);
            restrictToMiddleware(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 403,
                message: 'You do not have permission to perform this action',
            }));
        });
        it('should call next if user has required role', () => {
            // Arrange
            mockRequest.user = { ...mockUser, role: user_entity_1.UserRole.ADMIN };
            // Act
            const restrictToMiddleware = (0, auth_middleware_1.restrictTo)(user_entity_1.UserRole.ADMIN);
            restrictToMiddleware(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
});
