import { Queue } from 'bullmq';
export declare class LeadsSyncScheduler {
    private leadsImportQueue;
    private readonly logger;
    constructor(leadsImportQueue: Queue);
    handleLeadsImport(): Promise<void>;
}
