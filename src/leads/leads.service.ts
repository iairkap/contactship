import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { AiService } from './ai.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private aiService: AiService,
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

  async summarize(id: string): Promise<LeadResponseDto> {
    // 1. Buscar lead
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // 2. Generar resumen con IA
    const aiResult = await this.aiService.generateLeadSummary({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      country: lead.country,
    });

    // 3. Actualizar en DB
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        summary: aiResult.summary,
        nextAction: aiResult.next_action,
      },
    });

    // 4. Invalidar cache
    const cacheKey = `lead:${id}`;
    await this.cacheManager.del(cacheKey);

    return updatedLead;
  }
}
