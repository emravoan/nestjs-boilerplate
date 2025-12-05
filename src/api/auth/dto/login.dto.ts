import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @Length(4, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @Length(8, 64)
  password: string;
}
