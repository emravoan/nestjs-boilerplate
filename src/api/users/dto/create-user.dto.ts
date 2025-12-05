import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

import { IsUnique } from '../../../common/constraints/is-unique.constraint';
import { User } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsUnique({ entity: User, column: 'email' })
  email: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  @Length(4, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers, and underscores',
  })
  @IsUnique({ entity: User, column: 'username' })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @Length(8, 64)
  password: string;
}
