import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../common/envs/env.schema';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService<Env, true>) {}

  getDbUrl() {
    // TypeScript now knows DATABASE_URL is a string
    return this.configService.get('DATABASE_URL', { infer: true });
  }
}
