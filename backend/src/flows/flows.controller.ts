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
import { FlowsService } from './flows.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateFlowDto, UpdateFlowDto, ReorderStepsDto } from './dto/create-flow.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class FlowsController {
  constructor(private flowsService: FlowsService) {}

  @Get('accounts/:accountId/flows')
  findAllByAccount(@Param('accountId') accountId: string) {
    return this.flowsService.findAllByAccount(accountId);
  }

  @Post('accounts/:accountId/flows')
  create(@Param('accountId') accountId: string, @Body() dto: CreateFlowDto) {
    return this.flowsService.create(accountId, dto);
  }

  @Get('flows/:id')
  findOne(@Param('id') id: string) {
    return this.flowsService.findOne(id);
  }

  @Patch('flows/:id')
  update(@Param('id') id: string, @Body() dto: UpdateFlowDto) {
    return this.flowsService.update(id, dto);
  }

  @Delete('flows/:id')
  remove(@Param('id') id: string) {
    return this.flowsService.remove(id);
  }

  @Patch('flows/:id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.flowsService.toggleActive(id);
  }

  @Post('flows/:id/triggers')
  addTrigger(
    @Param('id') id: string,
    @Body() body: { type: string; value: string },
  ) {
    return this.flowsService.addTrigger(id, body.type, body.value);
  }

  @Delete('triggers/:id')
  removeTrigger(@Param('id') id: string) {
    return this.flowsService.removeTrigger(id);
  }

  @Post('flows/:id/steps')
  addStep(
    @Param('id') id: string,
    @Body() body: { order: number; type: string; content?: any; nextStepId?: string },
  ) {
    return this.flowsService.addStep(id, body);
  }

  @Patch('steps/:id')
  updateStep(
    @Param('id') id: string,
    @Body() body: { order?: number; type?: string; content?: any; nextStepId?: string },
  ) {
    return this.flowsService.updateStep(id, body);
  }

  @Delete('steps/:id')
  removeStep(@Param('id') id: string) {
    return this.flowsService.removeStep(id);
  }

  @Post('flows/:id/steps/reorder')
  reorderSteps(@Param('id') id: string, @Body() dto: ReorderStepsDto) {
    return this.flowsService.reorderSteps(id, dto.stepIds);
  }
}
