import { Module, forwardRef } from '@nestjs/common';
import { FlowEngineService } from './flow-engine.service';
import { AiIntegrationModule } from '../ai-integration/ai-integration.module';

@Module({
  imports: [forwardRef(() => AiIntegrationModule)],
  providers: [FlowEngineService],
  exports: [FlowEngineService],
})
export class FlowEngineModule {}
