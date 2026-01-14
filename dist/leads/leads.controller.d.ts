import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(createLeadDto: CreateLeadDto): Promise<LeadResponseDto>;
    findAll(): Promise<LeadResponseDto[]>;
    findOne(id: string): Promise<LeadResponseDto>;
}
