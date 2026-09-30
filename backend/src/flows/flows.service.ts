import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowDto, UpdateFlowDto, ReorderStepsDto } from './dto/create-flow.dto';

@Injectable()
export class FlowsService {
  constructor(private prisma: PrismaService) {}

  async findAllByAccount(accountId: string) {
    return this.prisma.flow.findMany({
      where: { accountId },
      include: {
        triggers: true,
        steps: { orderBy: { order: 'asc' } },
      },
      orderBy: { priority: 'desc' },
    });
  }

  async findOne(id: string) {
    const flow = await this.prisma.flow.findUnique({
      where: { id },
      include: {
        triggers: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async create(accountId: string, dto: CreateFlowDto) {
    const { triggers, steps, ...flowData } = dto;

    const stepsWithOrder = (steps || []).map((step, index) => ({
      order: step.order || index + 1,
      type: step.type,
      content: step.content || {},
      nextStepId: step.nextStepId,
    }));

    return this.prisma.flow.create({
      data: {
        ...flowData,
        accountId,
        triggers: triggers
          ? { create: triggers.map((t) => ({ type: t.type, value: t.value })) }
          : undefined,
        steps: steps ? { create: stepsWithOrder } : undefined,
      },
      include: {
        triggers: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateFlowDto) {
    await this.findOne(id);

    return this.prisma.flow.update({
      where: { id },
      data: dto,
      include: {
        triggers: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });
  }

  async toggleActive(id: string) {
    const flow = await this.findOne(id);

    return this.prisma.flow.update({
      where: { id },
      data: { isActive: !flow.isActive },
      include: {
        triggers: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.flow.delete({ where: { id } });

    return { message: 'Flow deleted' };
  }

  async addTrigger(flowId: string, type: string, value: string) {
    await this.findOne(flowId);

    return this.prisma.trigger.create({
      data: {
        flowId,
        type: type as any,
        value,
      },
    });
  }

  async removeTrigger(triggerId: string) {
    const trigger = await this.prisma.trigger.findUnique({
      where: { id: triggerId },
    });

    if (!trigger) {
      throw new NotFoundException('Trigger not found');
    }

    await this.prisma.trigger.delete({ where: { id: triggerId } });

    return { message: 'Trigger deleted' };
  }

  async addStep(flowId: string, dto: { order: number; type: string; content?: any; nextStepId?: string }) {
    await this.findOne(flowId);

    return this.prisma.flowStep.create({
      data: {
        flowId,
        order: dto.order,
        type: dto.type as any,
        content: dto.content || {},
        nextStepId: dto.nextStepId,
      },
    });
  }

  async updateStep(stepId: string, dto: { order?: number; type?: string; content?: any; nextStepId?: string }) {
    const step = await this.prisma.flowStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    const data: any = {};
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.nextStepId !== undefined) data.nextStepId = dto.nextStepId;

    return this.prisma.flowStep.update({
      where: { id: stepId },
      data,
    });
  }

  async removeStep(stepId: string) {
    const step = await this.prisma.flowStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    await this.prisma.flowStep.delete({ where: { id: stepId } });

    return { message: 'Step deleted' };
  }

  async reorderSteps(flowId: string, stepIds: string[]) {
    await this.findOne(flowId);

    for (let i = 0; i < stepIds.length; i++) {
      await this.prisma.flowStep.update({
        where: { id: stepIds[i] },
        data: { order: i + 1 },
      });
    }

    return this.findOne(flowId);
  }
}
