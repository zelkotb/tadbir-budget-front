import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Language, defaultLanguage, languages } from '@/app/configuration/language.config';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private translate = inject(TranslateService);

    readonly languages = languages;

    currentLang = signal<Language>(
        languages.find((l) => l.code === (localStorage.getItem('lang') ?? defaultLanguage)) ?? languages[0]
    );

    // Called by APP_INITIALIZER — blocks rendering until translations are loaded
    async init(): Promise<void> {
        const lang = this.currentLang();
        await firstValueFrom(this.translate.use(lang.code));
        document.documentElement.lang = lang.code;
        document.documentElement.dir = lang.direction;
    }

    setLanguage(code: string): void {
        const lang = languages.find((l) => l.code === code);
        if (!lang) return;
        this.currentLang.set(lang);
        localStorage.setItem('lang', code);
        this.translate.use(lang.code);
        document.documentElement.lang = lang.code;
        document.documentElement.dir = lang.direction;
    }
}