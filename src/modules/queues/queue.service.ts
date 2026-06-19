import { Injectable } from '@nestjs/common';

export type QueueJob = {
  id: string;
  queueName: string;
  jobName: string;
  payload: Record<string, unknown>;
  status: 'queued';
  liveWorkerStarted: false;
  createdAt: Date;
};

@Injectable()
export class QueueService {
  private readonly jobs: QueueJob[] = [];

  enqueue(queueName: string, jobName: string, payload: Record<string, unknown>): QueueJob {
    const job = Object.freeze({
      id: `mock_job_${this.jobs.length + 1}`,
      queueName,
      jobName,
      payload,
      status: 'queued' as const,
      liveWorkerStarted: false as const,
      createdAt: new Date()
    });
    this.jobs.push(job);
    return job;
  }

  list(queueName?: string) {
    return queueName ? this.jobs.filter((job) => job.queueName === queueName) : [...this.jobs];
  }

  contracts() {
    return {
      mode: 'mock_enqueue_only',
      liveWorkersStarted: false,
      queues: ['notifications', 'provider-webhooks', 'ai-recommendations', 'document-processing', 'audit-export'],
      productionAdapter: 'BullMQ with Redis, worker processes started only by explicit deployment/runbook action.'
    };
  }
}
