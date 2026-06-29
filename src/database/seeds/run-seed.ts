import { NestFactory } from '@nestjs/core';

import { UsersService } from '../../api/users/users.service';
import { AppModule } from '../../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersService = app.get(UsersService);

  console.log('Seeding database...');

  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'SuperSecureAdminPassword123!';

  try {
    const existingAdmin = await usersService.findOneByUsernameWithPassword(adminUsername);
    if (!existingAdmin) {
      await usersService.create({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
      });
      console.log(`Successfully seeded admin user: ${adminUsername}`);
    } else {
      console.log(`Admin user "${adminUsername}" already exists.`);
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  } finally {
    await app.close();
    console.log('Seeding process finished.');
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error during seed execution:', err);
  process.exit(1);
});
