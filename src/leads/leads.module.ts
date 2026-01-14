import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { RandomUserService } from './random-user.service';
import { LeadsImportProcessor } from './leads-import.processor';
import { LeadsSyncScheduler } from './leads-sync.scheduler';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'leads-import',
    }),
  ],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    RandomUserService,
    LeadsImportProcessor,
    LeadsSyncScheduler,
  ],
})
export class LeadsModule {}
