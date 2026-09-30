import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './dto/roles.decorator';
import { LoginDto, RegisterDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      return { error: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async register(@Body() dto: RegisterDto, @Request() req: any) {
    return this.authService.register(dto, req.user.role);
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private authService: AuthService) {}

  @Get()
  @Roles('superadmin')
  async findAll() {
    const users = await this.authService.findAllUsers();
    return { users };
  }

  @Post()
  @Roles('superadmin')
  async create(@Body() dto: RegisterDto) {
    return this.authService.register(dto, 'superadmin');
  }

  @Patch(':id')
  @Roles('superadmin')
  async update(@Param('id') id: string, @Body() body: { email?: string; role?: string; password?: string }) {
    return this.authService.updateUser(id, body as any);
  }

  @Delete(':id')
  @Roles('superadmin')
  async remove(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
