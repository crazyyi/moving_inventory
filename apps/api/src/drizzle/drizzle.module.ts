import { Module } from '@nestjs/common';
import { drizzleProvider } from './drizzle.provider';

@Module({
  providers: [...drizzleProvider],
  exports: [...drizzleProvider], // Exports the provider so other modules can use it
})
export class DrizzleModule { }