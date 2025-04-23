"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger")); // Adjust the path based on your project structure
class UserRepository extends typeorm_1.Repository {
    constructor() {
        super(user_entity_1.User, database_1.default.manager);
    }
    async findByEmail(email) {
        return this.findOne({ where: { email } });
    }
    async findByEmailWithPassword(email) {
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
        }
        catch (error) {
            logger_1.default.error('Error in findByEmailWithPassword:', error);
            throw error;
        }
    }
    async findByResetToken(token) {
        return this.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: new Date(Date.now()),
            },
        });
    }
    async findByRole(role) {
        return this.find({ where: { role } });
    }
}
exports.UserRepository = UserRepository;
// Export a singleton instance
exports.userRepository = new UserRepository();
