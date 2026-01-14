import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { AiService } from './ai.service';
export declare class LeadsService {
    private prisma;
    private cacheManager;
    private aiService;
    constructor(prisma: PrismaService, cacheManager: Cache, aiService: AiService);
    create(createLeadDto: CreateLeadDto): Promise<LeadResponseDto>;
    findAll(): Promise<LeadResponseDto[]>;
    findOne(id: string): Promise<LeadResponseDto>;
    summarize(id: string): Promise<LeadResponseDto>;
}
