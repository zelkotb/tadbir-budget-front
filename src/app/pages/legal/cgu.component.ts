import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Public "Conditions Générales d'Utilisation" page (also covers data protection
 * under Loi 09-08 and the CNDP). Linked from the signup consent checkbox so the
 * user can read the full terms before agreeing. No auth required.
 */
@Component({
    selector: 'app-cgu',
    standalone: true,
    imports: [RouterModule, TranslatePipe],
    template: `
        <div class="min-h-screen bg-surface-50 dark:bg-surface-950 py-10 px-4">
            <div class="max-w-3xl mx-auto">
                <a routerLink="/landing" class="inline-flex items-center gap-2 mb-6 text-surface-700 dark:text-surface-200 hover:text-primary">
                    <img src="/assets/img/maroc-logo.png" alt="" class="h-8 w-auto" />
                    <span class="font-bold text-lg">Tadbir Budget</span>
                </a>

                <article class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-2xl shadow-sm p-7 sm:p-12">
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ 'legal.cgu.page_title' | translate }}</h1>
                    <p class="text-sm text-muted-color mt-2">{{ 'legal.cgu.updated' | translate }}</p>

                    <p class="mt-6 leading-relaxed text-surface-700 dark:text-surface-200">{{ 'legal.cgu.intro_body' | translate }}</p>

                    @for (s of sections; track s.t) {
                        <section class="mt-8">
                            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ s.t | translate }}</h2>
                            <p class="mt-3 leading-relaxed text-surface-700 dark:text-surface-200">{{ s.b | translate }}</p>
                        </section>
                    }

                    <section class="mt-8">
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ 'legal.cgu.contact_title' | translate }}</h2>
                        <p class="mt-3 leading-relaxed text-surface-700 dark:text-surface-200">{{ 'legal.cgu.contact_body' | translate }}</p>
                    </section>

                    <div class="mt-10 pt-6 border-t border-surface">
                        <a routerLink="/auth/login" class="text-primary font-medium hover:underline">{{ 'legal.cgu.back' | translate }}</a>
                    </div>
                </article>
            </div>
        </div>
    `
})
export class Cgu {
    /** Section keys (title + body) — resolved through ngx-translate (FR/AR). */
    readonly sections = [
        { t: 'legal.cgu.s1_title', b: 'legal.cgu.s1_body' },
        { t: 'legal.cgu.s2_title', b: 'legal.cgu.s2_body' },
        { t: 'legal.cgu.s3_title', b: 'legal.cgu.s3_body' },
        { t: 'legal.cgu.s4_title', b: 'legal.cgu.s4_body' },
        { t: 'legal.cgu.s5_title', b: 'legal.cgu.s5_body' },
        { t: 'legal.cgu.s6_title', b: 'legal.cgu.s6_body' },
        { t: 'legal.cgu.s7_title', b: 'legal.cgu.s7_body' },
        { t: 'legal.cgu.s8_title', b: 'legal.cgu.s8_body' }
    ];
}
