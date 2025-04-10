import { UserService } from '../../services/user.service';
import { userRepository } from '../../repositories/user.repository';
import { User, UserRole } from '../../entities/user.entity';
import { AppError } from '../../middleware/error.middleware';

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
  let userService: UserService;
  let mockUser: User;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a new instance of UserService
    userService = new UserService();

    // Create a mock user
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      passwordDigest: 'hashedpassword',
      role: UserRole.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw an error if user not found', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(999)).rejects.toThrow(AppError);
      await expect(userService.getUserById(999)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const expectedUpdatedUser = {
        ...mockUser,
        ...updateData,
      };

      (userRepository.save as jest.Mock).mockResolvedValue(expectedUpdatedUser);

      // Act
      const result = await userService.updateProfile(1, updateData);

      // Assert
      expect(result).toEqual(expectedUpdatedUser);
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateData));
    });

    it('should check for duplicate email when updating email', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'taken@example.com',
      });

      const updateData = {
        email: 'taken@example.com',
      };

      // Act & Assert
      await expect(userService.updateProfile(1, updateData)).rejects.toThrow(AppError);
      await expect(userService.updateProfile(1, updateData)).rejects.toThrow(
        'Email is already in use',
      );
    });
  });

  describe('createPasswordResetToken', () => {
    it('should create a password reset token', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.createPasswordResetToken('john.doe@example.com');

      // Assert
      expect(result).toEqual('mocked-random-token');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: 'mocked-hashed-token',
          resetPasswordExpires: expect.any(Date),
        }),
      );
    });

    it('should throw an error if user not found', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.createPasswordResetToken('nonexistent@example.com')).rejects.toThrow(
        AppError,
      );
      await expect(userService.createPasswordResetToken('nonexistent@example.com')).rejects.toThrow(
        'There is no user with this email address',
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update a user role', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const updatedUser = {
        ...mockUser,
        role: UserRole.ADMIN,
      };

      (userRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUserRole(1, UserRole.ADMIN);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });
  });
});
