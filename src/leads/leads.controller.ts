import { Controller, Get, Post, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('create-lead')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createLeadDto: CreateLeadDto): Promise<LeadResponseDto> {
    return this.leadsService.create(createLeadDto);
  }

  @Get('leads')
  async findAll(): Promise<LeadResponseDto[]> {
    return this.leadsService.findAll();
  }
}
