import 'dotenv/config';
import type { AppConfig } from './app.config';

declare module '@nestjs/config' {
  interface ConfigService {
    get<T = AppConfig>(propertyPath: 'app'): T;
  }
}
