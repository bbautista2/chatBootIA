import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAccountDto, UpdateAccountDto, UpdateBotConfigDto } from './dto/create-account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.accountsService.findAll(user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Post()
  @Roles('superadmin')
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }

  @Patch(':id')
  @Roles('superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superadmin')
  deactivate(@Param('id') id: string) {
    return this.accountsService.deactivate(id);
  }

  @Get(':id/config')
  getBotConfig(@Param('id') id: string) {
    return this.accountsService.getBotConfig(id);
  }

  @Patch(':id/config')
  @Roles('superadmin')
  updateBotConfig(@Param('id') id: string, @Body() dto: UpdateBotConfigDto) {
    return this.accountsService.updateBotConfig(id, dto);
  }
}
