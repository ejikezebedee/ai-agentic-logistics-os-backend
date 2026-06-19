import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';
import { QueueService } from './queue.service';

@ApiTags('queues')
@Controller('queues')
@Roles(RoleCode.SUPER_ADMIN, RoleCode.COMPLIANCE_ADMIN)
export class QueuesController {
  constructor(private readonly queues: QueueService) {}

  @Get('contracts')
  contracts() {
    return this.queues.contracts();
  }

  @Post('enqueue')
  enqueue(@Body() body: { queueName: string; jobName: string; payload?: Record<string, unknown> }) {
    return this.queues.enqueue(body.queueName, body.jobName, body.payload ?? {});
  }

  @Get('jobs')
  jobs(@Query('queueName') queueName?: string) {
    return { jobs: this.queues.list(queueName) };
  }
}
