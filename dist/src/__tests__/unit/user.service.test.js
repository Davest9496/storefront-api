"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("../../services/user.service");
const user_repository_1 = require("../../repositories/user.repository");
const user_entity_1 = require("../../entities/user.entity");
const error_middleware_1 = require("../../middleware/error.middleware");
// Mock the repository
jest.mock('../../repositories/user.repository', () => ({
    userRepository: {
        findOne: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn((user) => Promise.resolve({ ...user, id: 1 })),
    },
}));
// Mock crypto for password reset
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => ({ toString: () => 'mocked-random-token' })),
    createHash: jest.fn(() => ({
        update: jest.fn(() => ({
            digest: jest.fn(() => 'mocked-hashed-token'),
        })),
    })),
}));
describe('UserService', () => {
    let userService;
    let mockUser;
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Create a new instance of UserService
        userService = new user_service_1.UserService();
        // Create a mock user
        mockUser = {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            passwordDigest: 'hashedpassword',
            role: user_entity_1.UserRole.CUSTOMER,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    });
    describe('getUserById', () => {
        it('should return a user if found', async () => {
            // Arrange
            user_repository_1.userRepository.findOne.mockResolvedValue(mockUser);
            // Act
            const result = await userService.getUserById(1);
            // Assert
            expect(result).toEqual(mockUser);
            expect(user_repository_1.userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });
        it('should throw an error if user not found', async () => {
            // Arrange
            user_repository_1.userRepository.findOne.mockResolvedValue(null);
            // Act & Assert
            await expect(userService.getUserById(999)).rejects.toThrow(error_middleware_1.AppError);
            await expect(userService.getUserById(999)).rejects.toThrow('User not found');
        });
    });
    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            // Arrange
            user_repository_1.userRepository.findOne.mockResolvedValue(mockUser);
            const updateData = {
                firstName: 'Jane',
                lastName: 'Smith',
            };
            const expectedUpdatedUser = {
                ...mockUser,
                ...updateData,
            };
            user_repository_1.userRepository.save.mockResolvedValue(expectedUpdatedUser);
            // Act
            const result = await userService.updateProfile(1, updateData);
            // Assert
            expect(result).toEqual(expectedUpdatedUser);
            expect(user_repository_1.userRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateData));
        });
        it('should check for duplicate email when updating email', async () => {
            // Arrange
            user_repository_1.userRepository.findOne.mockResolvedValue(mockUser);
            user_repository_1.userRepository.findByEmail.mockResolvedValue({
                id: 2,
                email: 'taken@example.com',
            });
            const updateData = {
                email: 'taken@example.com',
            };
            // Act & Assert
            await expect(userService.updateProfile(1, updateData)).rejects.toThrow(error_middleware_1.AppError);
            await expect(userService.updateProfile(1, updateData)).rejects.toThrow('Email is already in use');
        });
    });
    describe('createPasswordResetToken', () => {
        it('should create a password reset token', async () => {
            // Arrange
            user_repository_1.userRepository.findByEmail.mockResolvedValue(mockUser);
            // Act
            const result = await userService.createPasswordResetToken('john.doe@example.com');
            // Assert
            expect(result).toEqual('mocked-random-token');
            expect(user_repository_1.userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                resetPasswordToken: 'mocked-hashed-token',
                resetPasswordExpires: expect.any(Date),
            }));
        });
        it('should throw an error if user not found', async () => {
            // Arrange
            user_repository_1.userRepository.findByEmail.mockResolvedValue(null);
            // Act & Assert
            await expect(userService.createPasswordResetToken('nonexistent@example.com')).rejects.toThrow(error_middleware_1.AppError);
            await expect(userService.createPasswordResetToken('nonexistent@example.com')).rejects.toThrow('There is no user with this email address');
        });
    });
    describe('updateUserRole', () => {
        it('should update a user role', async () => {
            // Arrange
            user_repository_1.userRepository.findOne.mockResolvedValue(mockUser);
            const updatedUser = {
                ...mockUser,
                role: user_entity_1.UserRole.ADMIN,
            };
            user_repository_1.userRepository.save.mockResolvedValue(updatedUser);
            // Act
            const result = await userService.updateUserRole(1, user_entity_1.UserRole.ADMIN);
            // Assert
            expect(result).toEqual(updatedUser);
            expect(user_repository_1.userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                role: user_entity_1.UserRole.ADMIN,
            }));
        });
    });
});
