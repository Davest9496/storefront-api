import { hashPassword, comparePassword } from '../../utils/password.utils';

describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toEqual(password);
    expect(hashedPassword.startsWith('$2b$')).toBe(true); // Check bcrypt format
  });

  it('should correctly compare passwords', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);

    const isMatch = await comparePassword(password, hashedPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword', hashedPassword);
    expect(isWrongMatch).toBe(false);
  });
});
