"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const user_entity_1 = require("../entities/user.entity");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
class UserRepository {
    getRepository() {
        if (!database_1.default.isInitialized) {
            logger_1.default.error('Database not initialized when accessing User repository');
            throw new Error('Database connection not initialized');
        }
        return database_1.default.getRepository(user_entity_1.User);
    }
    async findByEmail(email) {
        return this.getRepository().findOne({ where: { email } });
    }
    async findByEmailWithPassword(email) {
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
        }
        catch (error) {
            logger_1.default.error('Error in findByEmailWithPassword:', error);
            throw error;
        }
    }
    async findOne(options) {
        return this.getRepository().findOne(options);
    }
    async find(options) {
        return this.getRepository().find(options);
    }
    create(userData) {
        return this.getRepository().create(userData);
    }
    async save(user) {
        return this.getRepository().save(user);
    }
    async findByResetToken(token) {
        return this.getRepository().findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: new Date(Date.now()),
            },
        });
    }
    async findByRole(role) {
        return this.getRepository().find({ where: { role } });
    }
}
exports.UserRepository = UserRepository;
// Export a singleton instance
exports.userRepository = new UserRepository();
