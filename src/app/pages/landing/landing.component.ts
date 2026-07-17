import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    inject,
    signal
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '@/app/services/language.service';

/**
 * Public landing — "Enquête Publique · Plan d'Aménagement".
 *
 * Mirrors design_handoff_request_detail/Enquête Publique - Landing.html (its own
 * template-style nav), on top of the app's PrimeNG (emerald) theme. All copy goes
 * through ngx-translate (FR/AR); the language switch uses the shared
 * LanguageService (which also flips dir=rtl). Brand accents/background follow the
 * template primary token (--p-primary-*).
 *
 * Scroll-reveal mirrors the handoff exactly: a `.tu-anim` class on <html> plus
 * global CSS hides `[data-reveal]` only while JS is active, and an
 * IntersectionObserver (with a hard failsafe) reveals them — so content can never
 * stay blank, and the entrance is identical to the reference.
 */
@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, TranslatePipe],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.scss'
})
export class Landing implements AfterViewInit, OnDestroy {
    private readonly host = inject(ElementRef<HTMLElement>);
    readonly lang = inject(LanguageService);

    // ── Nav state ───────────────────────────────────────────────────────────
    readonly scrolled   = signal(false);
    readonly mobileOpen = signal(false);
    readonly langOpen   = signal(false);

    /** Index of the open FAQ entry (0 = first open by default). */
    readonly openFaq = signal(0);

    // Count-up stat values (animated to their targets).
    readonly stat1 = signal(0);
    readonly stat2 = signal(0);
    readonly stat3 = signal(0);

    /** FAQ entries — keys resolved through the language service. */
    readonly faqs = [
        { q: 'landing.faq.q1', a: 'landing.faq.a1' },
        { q: 'landing.faq.q2', a: 'landing.faq.a2' },
        { q: 'landing.faq.q3', a: 'landing.faq.a3' },
        { q: 'landing.faq.q4', a: 'landing.faq.a4' }
    ];

    private targets: HTMLElement[] = [];
    private timeouts: number[] = [];
    private rafIds: number[] = [];
    private readonly onLoad = () => this.reveal();

    constructor() {
        // Mark JS active up front (before the view paints) so the reveal "hidden"
        // state is in place from the first frame. Mirrors the handoff's `html.js`.
        document.documentElement.classList.add('tu-anim');
    }

    @HostListener('window:scroll')
    onScroll(): void { this.scrolled.set(window.scrollY > 12); this.reveal(); }

    @HostListener('window:resize')
    onResize(): void { this.reveal(); }

    /** Close the language menu when clicking anywhere else. */
    @HostListener('document:click')
    onDocClick(): void { if (this.langOpen()) this.langOpen.set(false); }

    ngAfterViewInit(): void {
        this.scrolled.set(window.scrollY > 12);

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const root = this.host.nativeElement as HTMLElement;
        this.targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));

        if (reduce) {
            this.targets.forEach((el) => el.classList.add('in', 'seen'));
            this.setStatsFinal();
            return;
        }

        // Scroll-aligned reveal: each element animates in as it enters the viewport
        // (matches the design handoff). Re-checked on scroll/resize/load and after
        // layout settles, so nothing reveals before you scroll to it.
        this.reveal();
        window.addEventListener('load', this.onLoad);
        [120, 400, 800].forEach((d) => this.timeouts.push(window.setTimeout(() => this.reveal(), d)));

        this.animateStats();
    }

    /** Reveal every target whose top has scrolled into the lower viewport. */
    private reveal(): void {
        if (this.targets.length === 0) return;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        for (const el of this.targets) {
            if (el.classList.contains('in')) continue;
            if (el.getBoundingClientRect().top < vh * 0.9) {
                el.classList.add('in');
                this.timeouts.push(window.setTimeout(() => el.classList.add('seen'), 820));
            }
        }
    }

    ngOnDestroy(): void {
        document.documentElement.classList.remove('tu-anim');
        window.removeEventListener('load', this.onLoad);
        this.timeouts.forEach((id) => clearTimeout(id));
        this.rafIds.forEach((id) => cancelAnimationFrame(id));
    }

    // ── Interactions ──────────────────────────────────────────────────────────
    scrollTop(): void { window.scrollTo({ top: 0, behavior: 'smooth' }); this.mobileOpen.set(false); }

    scrollTo(id: string): void {
        this.mobileOpen.set(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    toggleMobile(): void { this.mobileOpen.update((v) => !v); }

    toggleLangMenu(ev: Event): void { ev.stopPropagation(); this.langOpen.update((v) => !v); }

    selectLang(code: string): void { this.lang.setLanguage(code); this.langOpen.set(false); }

    toggleFaq(i: number): void { this.openFaq.update((cur) => (cur === i ? -1 : i)); }

    // ── Count-up ────────────────────────────────────────────────────────────
    private setStatsFinal(): void { this.stat1.set(100); this.stat2.set(30); this.stat3.set(24); }

    private animateStats(): void {
        this.countUp(this.stat1, 100);
        this.countUp(this.stat2, 30);
        this.countUp(this.stat3, 24);
    }

    private countUp(target: ReturnType<typeof signal<number>>, end: number): void {
        const dur = 1300;
        const t0 = performance.now();
        const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            target.set(Math.round(end * eased));
            if (p < 1) this.rafIds.push(requestAnimationFrame(tick));
        };
        this.rafIds.push(requestAnimationFrame(tick));
        // Failsafe if rAF is throttled/paused.
        setTimeout(() => target.set(end), dur + 250);
    }
}
