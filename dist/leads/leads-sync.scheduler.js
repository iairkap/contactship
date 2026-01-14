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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LeadsSyncScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsSyncScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let LeadsSyncScheduler = LeadsSyncScheduler_1 = class LeadsSyncScheduler {
    constructor(leadsImportQueue) {
        this.leadsImportQueue = leadsImportQueue;
        this.logger = new common_1.Logger(LeadsSyncScheduler_1.name);
    }
    async handleLeadsImport() {
        this.logger.log('Starting scheduled leads import job');
        await this.leadsImportQueue.add('import-random-leads', {}, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
        this.logger.log('Leads import job queued successfully');
    }
};
exports.LeadsSyncScheduler = LeadsSyncScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeadsSyncScheduler.prototype, "handleLeadsImport", null);
exports.LeadsSyncScheduler = LeadsSyncScheduler = LeadsSyncScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('leads-import')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], LeadsSyncScheduler);
//# sourceMappingURL=leads-sync.scheduler.js.map