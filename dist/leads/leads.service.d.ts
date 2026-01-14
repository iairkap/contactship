import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
export declare class LeadsService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: Cache);
    create(createLeadDto: CreateLeadDto): Promise<LeadResponseDto>;
    findAll(): Promise<LeadResponseDto[]>;
    findOne(id: string): Promise<LeadResponseDto>;
}
