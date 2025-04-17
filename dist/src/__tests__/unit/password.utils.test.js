"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_utils_1 = require("../../utils/password.utils");
describe('Password Utilities', () => {
    it('should hash a password', async () => {
        const password = 'TestPassword123!';
        const hashedPassword = await (0, password_utils_1.hashPassword)(password);
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toEqual(password);
        expect(hashedPassword.startsWith('$2b$')).toBe(true); // Check bcrypt format
    });
    it('should correctly compare passwords', async () => {
        const password = 'TestPassword123!';
        const hashedPassword = await (0, password_utils_1.hashPassword)(password);
        const isMatch = await (0, password_utils_1.comparePassword)(password, hashedPassword);
        expect(isMatch).toBe(true);
        const isWrongMatch = await (0, password_utils_1.comparePassword)('WrongPassword', hashedPassword);
        expect(isWrongMatch).toBe(false);
    });
});
