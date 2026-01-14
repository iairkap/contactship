import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

@Injectable()
export class RandomUserService {
  private readonly logger = new Logger(RandomUserService.name);
  private readonly API_URL = 'https://randomuser.me/api/';

  constructor(private readonly httpService: HttpService) {}

  async fetchRandomUsers(count: number = 10): Promise<RandomUserResponse> {
    try {
      this.logger.log(`Fetching ${count} random users from ${this.API_URL}`);
      
      const response = await firstValueFrom(
        this.httpService.get<RandomUserResponse>(this.API_URL, {
          params: { results: count },
        }),
      );

      this.logger.log(`Successfully fetched ${response.data.results.length} users`);
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching random users', error);
      throw error;
    }
  }
}
