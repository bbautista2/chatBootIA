import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Controller('accounts/:accountId/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  findAll(
    @Param('accountId') accountId: string,
    @Query() query: PaginationQueryDto,
    @Query('tags') tags?: string,
  ) {
    return this.contactsService.findAllByAccount(accountId, query, tags);
  }

  @Get(':id')
  findOne(@Param('accountId') accountId: string, @Param('id') id: string) {
    return this.contactsService.findOne(accountId, id);
  }

  @Patch(':id/tags')
  updateTags(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return this.contactsService.updateTags(accountId, id, tags);
  }
}
