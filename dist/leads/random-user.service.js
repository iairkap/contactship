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
var RandomUserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomUserService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let RandomUserService = RandomUserService_1 = class RandomUserService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(RandomUserService_1.name);
        this.API_URL = 'https://randomuser.me/api/';
    }
    async fetchRandomUsers(count = 10) {
        try {
            this.logger.log(`Fetching ${count} random users from ${this.API_URL}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(this.API_URL, {
                params: { results: count },
            }));
            this.logger.log(`Successfully fetched ${response.data.results.length} users`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Error fetching random users', error);
            throw error;
        }
    }
};
exports.RandomUserService = RandomUserService;
exports.RandomUserService = RandomUserService = RandomUserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], RandomUserService);
//# sourceMappingURL=random-user.service.js.map