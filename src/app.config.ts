import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { defaultLayoutConfig, buildPrimaryScale, buildSurfaceScale } from '@/app/configuration/layout.config';
import { defaultLanguage } from '@/app/configuration/language.config';
import { LanguageService } from '@/app/services/language.service';
import { AuthService } from '@/app/pages/auth/auth.service';
import { authInterceptor } from '@/app/interceptors/auth.interceptor';
import { errorInterceptor } from '@/app/interceptors/error.interceptor';
import { loadingInterceptor } from '@/app/interceptors/loading.interceptor';
import { appRoutes } from './app.routes';

const presets = { Aura, Lara, Nora } as const;

const surface = buildSurfaceScale(defaultLayoutConfig.surface);

const appPreset = definePreset(presets[defaultLayoutConfig.preset as keyof typeof presets], {
    semantic: {
        primary: buildPrimaryScale(defaultLayoutConfig.primary),
        ...(surface ? {
            colorScheme: {
                light: { surface },
                dark:  { surface }
            }
        } : {})
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation()
        ),

        // Interceptors run in declaration order:
        //   authInterceptor  → attaches Bearer token & handles silent refresh
        //   errorInterceptor → classifies errors, shows toasts, redirects
        provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
        ),

        provideZonelessChangeDetection(),

        providePrimeNG({
            theme: {
                preset: appPreset,
                options: { darkModeSelector: '.app-dark' }
            }
        }),

        // Required by ToastService → <p-toast> in AppComponent
        MessageService,

        provideTranslateService({ fallbackLang: defaultLanguage }),
        ...provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
        provideAppInitializer(() => Promise.all([
            inject(LanguageService).init(),
            inject(AuthService).tryRestoreSession()
        ]))
    ]
};
