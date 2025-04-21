import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import AppDataSource from '../config/database';
import logger from '../utils/logger'; // Adjust the path based on your project structure

export class UserRepository extends Repository<User> {
  constructor() {
    super(User, AppDataSource.manager);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    try {
      return this.createQueryBuilder('user')
        .select([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.email',
          'user.passwordDigest',
          'user.role',
        ])
        .where('user.email = :email', { email })
        .getOne();
    } catch (error) {
      logger.error('Error in findByEmailWithPassword:', error);
      throw error;
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now()),
      },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.find({ where: { role } });
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
