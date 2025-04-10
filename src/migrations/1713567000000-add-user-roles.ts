import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoles1713567000000 implements MigrationInterface {
  name = 'AddUserRoles1713567000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the enum type already exists before creating it
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'user_role'
      );
    `);

    if (!enumExists[0].exists) {
      // Create user_role enum type
      await queryRunner.query(`CREATE TYPE user_role AS ENUM ('customer', 'admin')`);
    }

    // Check if column exists before adding it
    const roleColumnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      );
    `);

    if (!roleColumnExists[0].exists) {
      // Add role column to users table
      await queryRunner.query(
        `ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'customer'`,
      );
    }

    // Check if reset_password_token column exists
    const tokenColumnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'reset_password_token'
      );
    `);

    if (!tokenColumnExists[0].exists) {
      // Add password reset token column
      await queryRunner.query(`ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255)`);
    }

    // Check if reset_password_expires column exists
    const expiresColumnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'reset_password_expires'
      );
    `);

    if (!expiresColumnExists[0].exists) {
      // Add password reset expires column
      await queryRunner.query(`ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMP`);
    }

    // Set the first user as admin (for testing purposes)
    await queryRunner.query(`UPDATE users SET role = 'admin' WHERE id = 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS role`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS reset_password_token`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS reset_password_expires`);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
