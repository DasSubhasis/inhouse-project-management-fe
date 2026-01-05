
import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ConfigService } from './core/services/config.service';


export function configInitializer(configService: ConfigService) {
  return () => {
    console.log('[APP CONFIG] Initializing config...');
    return configService.loadConfig().then(() => {
      console.log('[APP CONFIG] Config initialization complete');
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: configInitializer,
      deps: [ConfigService],
      multi: true
    }
  ]
};
