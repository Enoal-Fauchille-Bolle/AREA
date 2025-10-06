import 'dotenv/config';
import type { AppConfig } from './app.config';

declare module '@nestjs/config' {
  interface ConfigService {
    get<T = AppConfig>(propertyPath: 'app'): T;
    get<T = any>(propertyPath: keyof AppConfig): T | undefined;
    get<T = any>(propertyPath: keyof AppConfig, defaultValue: T): T;
  }
}
