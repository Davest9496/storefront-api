import { userRepository } from '../repositories/user.repository';
import { User, UserRole } from '../entities/user.entity';
import { AppError } from '../middleware/error.middleware';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResult {
  user: User;
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async signup(signupData: SignupData): Promise<AuthResult> {
    // Check if user with this email already exists
    const existingUser = await userRepository.findByEmail(signupData.email);

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    // Create new user
    const newUser = userRepository.create({
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      email: signupData.email,
      passwordDigest: await hashPassword(signupData.password),
      role: signupData.role || UserRole.CUSTOMER,
    });

    // Save user to database
    const user = await userRepository.save(newUser);

    // Generate JWT token
    const token = generateToken(user);

    return { user, token };
  }

  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email and include password
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Check if password is correct
    const isPasswordValid = await comparePassword(password, user.passwordDigest);

    if (!isPasswordValid) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    return { user, token };
  }
}

// Export a singleton instance
export const authService = new AuthService();
