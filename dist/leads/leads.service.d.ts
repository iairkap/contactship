import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
export declare class LeadsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createLeadDto: CreateLeadDto): Promise<LeadResponseDto>;
    findAll(): Promise<LeadResponseDto[]>;
}
