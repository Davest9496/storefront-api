import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import AppDataSource from '../config/database';
import logger from '../utils/logger';

export class UserRepository {
  private getRepository(): Repository<User> {
    if (!AppDataSource.isInitialized) {
      logger.error('Database not initialized when accessing User repository');
      throw new Error('Database connection not initialized');
    }
    return AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.getRepository().findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    try {
      return this.getRepository()
        .createQueryBuilder('user')
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

  async findOne(options: FindOneOptions<User>): Promise<User | null> {
    return this.getRepository().findOne(options);
  }

  async find(options?: FindManyOptions<User> | undefined): Promise<User[]> {
    return this.getRepository().find(options);
  }

  create(userData: Partial<User>): User {
    return this.getRepository().create(userData);
  }

  async save(user: User): Promise<User> {
    return this.getRepository().save(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.getRepository().findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now()),
      },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.getRepository().find({ where: { role } });
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
