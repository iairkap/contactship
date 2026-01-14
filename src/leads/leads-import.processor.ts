import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LeadsService } from './leads.service';
import { RandomUserService } from './random-user.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Processor('leads-import')
export class LeadsImportProcessor extends WorkerHost {
  private readonly logger = new Logger(LeadsImportProcessor.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly randomUserService: RandomUserService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job ${job.id}: importing leads from randomuser.me`);

    try {
      const data = await this.randomUserService.fetchRandomUsers(10);
      
      let imported = 0;
      let duplicates = 0;

      for (const user of data.results) {
        const leadDto: CreateLeadDto = {
          email: user.email,
          firstName: user.name.first,
          lastName: user.name.last,
          phone: user.phone,
          city: user.location.city,
          country: user.location.country,
        };

        try {
          await this.leadsService.create(leadDto);
          imported++;
          this.logger.log(`Imported lead: ${user.email}`);
        } catch (error) {
          if (error.status === 409) {
            duplicates++;
            this.logger.log(`Skipped duplicate: ${user.email}`);
          } else {
            this.logger.error(`Error importing ${user.email}`, error);
          }
        }
      }

      this.logger.log(
        `Import completed: ${imported} imported, ${duplicates} duplicates skipped`,
      );
    } catch (error) {
      this.logger.error('Failed to process import job', error);
      throw error;
    }
  }
}
