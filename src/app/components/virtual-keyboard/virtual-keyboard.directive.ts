import {
    AfterViewInit,
    Directive,
    ElementRef,
    OnDestroy,
    Renderer2,
    inject
} from '@angular/core';
import { VirtualKeyboardService } from './virtual-keyboard.service';

/**
 * Adds a keyboard-icon button at the right edge of the input that opens
 * the Arabic virtual keyboard. The icon position is fixed — it never moves.
 * Text direction inside the input is handled by dir="auto" on the native element.
 *
 * DOM structure:
 *   <span class="kb-input-wrapper">
 *     <input dir="auto" ... />
 *     <button class="kb-trigger-btn"><i class="pi pi-language"></i></button>
 *   </span>
 */
@Directive({
    selector: 'input[appArabicKeyboard], textarea[appArabicKeyboard]',
    standalone: true
})
export class ArabicKeyboardDirective implements AfterViewInit, OnDestroy {
    private el        = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
    private renderer  = inject(Renderer2);
    private kbService = inject(VirtualKeyboardService);

    private unlisten: Array<() => void> = [];

    ngAfterViewInit(): void {
        const input  = this.el.nativeElement;
        const parent = input.parentElement;
        if (!parent) return;

        // ── 1. Wrapper ─────────────────────────────────────────────────────
        const wrapper: HTMLElement = this.renderer.createElement('span');
        this.renderer.addClass(wrapper, 'kb-input-wrapper');
        this.renderer.insertBefore(parent, wrapper, input);
        this.renderer.appendChild(wrapper, input);

        // ── 2. Auto-direction ──────────────────────────────────────────────
        // The browser flips text flow as soon as the first strong character
        // is Arabic; no JS needed for the text itself.
        this.renderer.setAttribute(input, 'dir', 'auto');

        // ── 3. Icon button ─────────────────────────────────────────────────
        const btn: HTMLElement = this.renderer.createElement('button');
        this.renderer.setAttribute(btn, 'type', 'button');
        this.renderer.setAttribute(btn, 'tabindex', '-1');
        this.renderer.setAttribute(btn, 'aria-label', 'لوحة المفاتيح العربية');
        this.renderer.addClass(btn, 'kb-trigger-btn');

        const icon: HTMLElement = this.renderer.createElement('i');
        this.renderer.addClass(icon, 'pi');
        this.renderer.addClass(icon, 'pi-language');
        this.renderer.appendChild(btn, icon);
        this.renderer.appendChild(wrapper, btn);

        // ── 4. Events ──────────────────────────────────────────────────────
        this.unlisten.push(
            this.renderer.listen(btn, 'mousedown', (e: MouseEvent) => e.preventDefault()),
            this.renderer.listen(btn, 'click', () => this.kbService.open(input))
        );
    }

    ngOnDestroy(): void {
        this.unlisten.forEach((fn) => fn());
    }
}
