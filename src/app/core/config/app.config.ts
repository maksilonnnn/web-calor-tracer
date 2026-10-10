import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeRu from '@angular/common/locales/ru';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { apiPrefixInterceptor } from '../http/api-prefix.interceptor';
import { routes } from './app.routes';

registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'ru' },
    provideHttpClient(withInterceptors([apiPrefixInterceptor, apiErrorInterceptor])),
  ],
};
