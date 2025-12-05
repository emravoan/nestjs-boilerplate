import { IntersectionType, PickType } from '@nestjs/swagger';

import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from './login.dto';

export class RegisterDto extends IntersectionType(PickType(CreateUserDto, ['email'] as const), LoginDto) {}
