import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Import OAuth2 authentication module
// main.ts -- Angular 15+ version
import { HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { TranslateLoader , TranslateModule} from '@ngx-translate/core';

import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json')
}

const translateConfig = {
  defaultLanguage: 'en',
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient]
  }
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({mode: 'md', innerHTMLTemplatesEnabled: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideOAuthClient(),
    importProvidersFrom(HttpClientModule, TranslateModule.forRoot(translateConfig))
  ],
});

