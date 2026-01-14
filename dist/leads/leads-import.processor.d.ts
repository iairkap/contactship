import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LeadsService } from './leads.service';
import { RandomUserService } from './random-user.service';
export declare class LeadsImportProcessor extends WorkerHost {
    private readonly leadsService;
    private readonly randomUserService;
    private readonly logger;
    constructor(leadsService: LeadsService, randomUserService: RandomUserService);
    process(job: Job): Promise<void>;
}
