import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<LeadResponseDto> {
    try {
      const lead = await this.prisma.lead.create({
        data: createLeadDto,
      });
      return lead;
    } catch (error) {
      // Prisma unique constraint error
      if (error.code === 'P2002') {
        throw new ConflictException('Lead with this email already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<LeadResponseDto[]> {
    return this.prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<LeadResponseDto> {
    const cacheKey = `lead:${id}`;

    // 1. Intentar obtener del cache (Cache-Aside)
    const cachedLead = await this.cacheManager.get<LeadResponseDto>(cacheKey);
    
    if (cachedLead) {
      return cachedLead;
    }

    // 2. Si no está en cache, buscar en DB
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // 3. Guardar en cache para futuras consultas
    await this.cacheManager.set(cacheKey, lead);

    return lead;
  }
}
