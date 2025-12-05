import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';

import { PaginatedDto } from '../../common/dto/paginated.dto';
import { BaseService } from '../../common/services/base.service';
import { hashPassword } from '../../common/utils/password/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  /**
   * Returns paginated users with optional username/email filtering.
   */
  findAll(query: QueryUserDto): Promise<PaginatedDto<User>> {
    const where: FindOptionsWhere<User> = {
      ...(query.username ? { username: Like(`%${query.username.toLowerCase()}%`) } : {}),
      ...(query.email ? { email: Like(`%${query.email.toLowerCase()}%`) } : {}),
    };

    return this.paginate(query, {
      where,
      order: { id: 'DESC' },
    });
  }

  /**
   * Finds a user by numeric ID.
   */
  findOneById(id: number): Promise<User | null> {
    return this.findOneBy({ id });
  }

  /**
   * Finds a user by ID and throws if it does not exist.
   */
  findOneByIdOrFail(id: number): Promise<User> {
    return this.findOneByOrFail({ id }, 'User not found');
  }

  /**
   * Loads user including password for credential validation.
   */
  findOneByUsernameWithPassword(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username: username.toLowerCase() },
      select: ['id', 'email', 'username', 'password', 'createdAt', 'updatedAt'],
    });
  }

  /**
   * Creates a new user after uniqueness checks and password hashing.
   */
  async create(payload: CreateUserDto): Promise<User> {
    const email = payload.email.toLowerCase();
    const username = payload.username.toLowerCase();

    await this.ensureUnique(email, username);

    const password = await hashPassword(payload.password);
    const user = this.usersRepository.create({
      email,
      username,
      password,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Updates mutable user fields with uniqueness and hashing safeguards.
   */
  async update(id: number, payload: UpdateUserDto): Promise<User> {
    const user = await this.findOneByIdOrFail(id);

    if (payload.email && payload.email.toLowerCase() !== user.email) {
      const exists = await this.usersRepository.exists({
        where: { email: payload.email.toLowerCase() },
      });
      if (exists) {
        throw new ConflictException('Email is already taken');
      }
      user.email = payload.email.toLowerCase();
    }

    if (payload.username && payload.username.toLowerCase() !== user.username) {
      const exists = await this.usersRepository.exists({
        where: { username: payload.username.toLowerCase() },
      });
      if (exists) {
        throw new ConflictException('Username is already taken');
      }
      user.username = payload.username.toLowerCase();
    }

    if (payload.password) {
      user.password = await hashPassword(payload.password);
    }

    await this.usersRepository.save(user);
    return this.findOneByIdOrFail(id);
  }

  /**
   * Validates uniqueness for both email and username.
   */
  private async ensureUnique(email: string, username: string): Promise<void> {
    const [emailExists, usernameExists] = await Promise.all([
      this.usersRepository.exists({ where: { email } }),
      this.usersRepository.exists({ where: { username } }),
    ]);

    if (emailExists) {
      throw new ConflictException('Email is already taken');
    }

    if (usernameExists) {
      throw new ConflictException('Username is already taken');
    }
  }
}
