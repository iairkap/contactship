"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const axios_1 = require("@nestjs/axios");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const leads_controller_1 = require("./leads.controller");
const leads_service_1 = require("./leads.service");
const random_user_service_1 = require("./random-user.service");
const leads_import_processor_1 = require("./leads-import.processor");
const leads_sync_scheduler_1 = require("./leads-sync.scheduler");
let LeadsModule = class LeadsModule {
};
exports.LeadsModule = LeadsModule;
exports.LeadsModule = LeadsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'leads-import',
            }),
        ],
        controllers: [leads_controller_1.LeadsController],
        providers: [
            leads_service_1.LeadsService,
            random_user_service_1.RandomUserService,
            leads_import_processor_1.LeadsImportProcessor,
            leads_sync_scheduler_1.LeadsSyncScheduler,
        ],
    })
], LeadsModule);
//# sourceMappingURL=leads.module.js.map