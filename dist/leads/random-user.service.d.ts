import { HttpService } from '@nestjs/axios';
export interface RandomUserResponse {
    results: Array<{
        name: {
            first: string;
            last: string;
        };
        email: string;
        phone: string;
        location: {
            city: string;
            country: string;
        };
    }>;
}
export declare class RandomUserService {
    private readonly httpService;
    private readonly logger;
    private readonly API_URL;
    constructor(httpService: HttpService);
    fetchRandomUsers(count?: number): Promise<RandomUserResponse>;
}
