import { ConfigService } from '@nestjs/config';
export interface AiSummaryResult {
    summary: string;
    next_action: string;
}
export declare class AiService {
    private configService;
    private readonly logger;
    private genAI;
    private model;
    constructor(configService: ConfigService);
    generateLeadSummary(leadData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        city?: string;
        country?: string;
    }): Promise<AiSummaryResult>;
}
