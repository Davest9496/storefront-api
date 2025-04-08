import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import AppDataSource from '../config/database';

export class UserRepository extends Repository<User> {
  constructor() {
    super(User, AppDataSource.manager);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.passwordDigest')
      .where('user.email = :email', { email })
      .getOne();
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
