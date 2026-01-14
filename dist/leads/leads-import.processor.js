"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LeadsImportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsImportProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const leads_service_1 = require("./leads.service");
const random_user_service_1 = require("./random-user.service");
let LeadsImportProcessor = LeadsImportProcessor_1 = class LeadsImportProcessor extends bullmq_1.WorkerHost {
    constructor(leadsService, randomUserService) {
        super();
        this.leadsService = leadsService;
        this.randomUserService = randomUserService;
        this.logger = new common_1.Logger(LeadsImportProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id}: importing leads from randomuser.me`);
        try {
            const data = await this.randomUserService.fetchRandomUsers(10);
            let imported = 0;
            let duplicates = 0;
            for (const user of data.results) {
                const leadDto = {
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
                }
                catch (error) {
                    if (error.status === 409) {
                        duplicates++;
                        this.logger.log(`Skipped duplicate: ${user.email}`);
                    }
                    else {
                        this.logger.error(`Error importing ${user.email}`, error);
                    }
                }
            }
            this.logger.log(`Import completed: ${imported} imported, ${duplicates} duplicates skipped`);
        }
        catch (error) {
            this.logger.error('Failed to process import job', error);
            throw error;
        }
    }
};
exports.LeadsImportProcessor = LeadsImportProcessor;
exports.LeadsImportProcessor = LeadsImportProcessor = LeadsImportProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('leads-import'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService,
        random_user_service_1.RandomUserService])
], LeadsImportProcessor);
//# sourceMappingURL=leads-import.processor.js.map