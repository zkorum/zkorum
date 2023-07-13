import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiOkResponse } from '@nestjs/swagger';
import { BooleanResponse } from '../shared/dto';

export class IsEmailAvailableDTO {
  @IsNotEmpty()
  @MaxLength(254)
  @IsEmail()
  @ApiProperty()
  email: string;
}

export class IsUsernameAvailableDTO {
  @IsNotEmpty()
  @MaxLength(32)
  @ApiProperty()
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('isEmailAvailable')
  @ApiOkResponse({
    description: 'Verification successful',
    type: Boolean,
  })
  isEmailAvailable(@Body() dto: IsEmailAvailableDTO): Promise<boolean> {
    return this.authService.isEmailAvailable(dto);
  }

  @Post('isUsernameAvailable')
  isUsernameAvailable(@Body() dto: IsUsernameAvailableDTO) {
    return this.authService.isUsernameAvailable(dto);
  }
}
