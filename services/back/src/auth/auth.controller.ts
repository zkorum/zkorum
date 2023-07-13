import { Body, Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class IsEmailAvailableDTO {
  @IsNotEmpty()
  @MaxLength(254)
  @IsEmail()
  email: string;
}

export class IsUsernameAvailableDTO {
  @IsNotEmpty()
  @MaxLength(32)
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('isEmailAvailable')
  isEmailAvailable(@Body() dto: IsEmailAvailableDTO) {
    return this.authService.isEmailAvailable(dto);
  }

  @Get('isUsernameAvailable')
  isUsernameAvailable(@Body() dto: IsUsernameAvailableDTO) {
    return this.authService.isUsernameAvailable(dto);
  }
}
