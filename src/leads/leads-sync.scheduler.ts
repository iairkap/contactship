import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class LeadsSyncScheduler {
  private readonly logger = new Logger(LeadsSyncScheduler.name);

  constructor(
    @InjectQueue('leads-import') private leadsImportQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleLeadsImport() {
    this.logger.log('Starting scheduled leads import job');
    
    await this.leadsImportQueue.add(
      'import-random-leads',
      {},
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    
    this.logger.log('Leads import job queued successfully');
  }
}
