import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

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
}
