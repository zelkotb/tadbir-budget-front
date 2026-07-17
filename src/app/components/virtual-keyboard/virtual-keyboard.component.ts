import { Component, inject } from '@angular/core';
import { VirtualKeyboardService } from './virtual-keyboard.service';

/**
 * Standard Arabic keyboard rows.
 * Alef variants (أ إ آ ا) are grouped in row 2 for easy access.
 */
const KEYBOARD_ROWS: string[][] = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د', 'ذ'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'أ', 'إ', 'آ', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ']
];

@Component({
    selector: 'app-virtual-keyboard',
    standalone: true,
    template: `
@if (kb.visible()) {
    <!-- Invisible backdrop that closes the keyboard on outside click -->
    <div
        class="fixed inset-0 z-40"
        (click)="kb.close()"
    ></div>

    <!-- Keyboard panel -->
    <div
        class="fixed bottom-0 left-0 right-0 z-50 shadow-2xl select-none"
        style="background: var(--surface-900, #1e1e2e); border-top: 1px solid var(--surface-700, #383860);"
        dir="rtl"
        (mousedown)="$event.preventDefault()"
    >
        <!-- Toolbar -->
        <div class="flex items-center justify-between px-4 pt-3 pb-1">
            <span style="color: var(--surface-300, #ced4da); font-size: 0.8rem;">
                ⌨️ لوحة المفاتيح العربية
            </span>
            <button
                class="cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors"
                style="background: var(--surface-700); color: var(--surface-100);"
                (click)="kb.close()"
                (mousedown)="$event.preventDefault()"
            >✕ إغلاق</button>
        </div>

        <!-- Letter rows -->
        <div class="px-3 pb-1">
            @for (row of rows; track $index) {
                <div class="flex justify-center gap-1 mb-1">
                    @for (key of row; track $index) {
                        <button
                            class="key-btn cursor-pointer rounded text-base font-medium transition-all"
                            style="
                                min-width: 2.4rem;
                                height: 2.8rem;
                                padding: 0 0.35rem;
                                background: var(--surface-700, #383860);
                                color: var(--surface-0, #ffffff);
                                border: 1px solid var(--surface-600, #4a4a7a);
                            "
                            (click)="kb.type(key)"
                            (mousedown)="$event.preventDefault()"
                        >{{ key }}</button>
                    }
                </div>
            }
        </div>

        <!-- Bottom action row -->
        <div class="flex gap-2 px-3 pb-4">
            <!-- Backspace -->
            <button
                class="cursor-pointer rounded text-base font-medium transition-all"
                style="
                    width: 5rem;
                    height: 2.8rem;
                    background: var(--surface-600, #4a4a7a);
                    color: var(--surface-0, #ffffff);
                    border: 1px solid var(--surface-500);
                "
                (click)="kb.backspace()"
                (mousedown)="$event.preventDefault()"
            >⌫</button>

            <!-- Space -->
            <button
                class="cursor-pointer rounded text-base font-medium transition-all flex-1"
                style="
                    height: 2.8rem;
                    background: var(--surface-700, #383860);
                    color: var(--surface-300, #ced4da);
                    border: 1px solid var(--surface-600);
                "
                (click)="kb.type(' ')"
                (mousedown)="$event.preventDefault()"
            >مسافة</button>

            <!-- Close / Done -->
            <button
                class="cursor-pointer rounded text-base font-medium transition-all"
                style="
                    width: 5rem;
                    height: 2.8rem;
                    background: var(--primary-color, #6366f1);
                    color: #ffffff;
                    border: none;
                "
                (click)="kb.close()"
                (mousedown)="$event.preventDefault()"
            >↵</button>
        </div>
    </div>
}
    `
})
export class VirtualKeyboardComponent {
    readonly kb   = inject(VirtualKeyboardService);
    readonly rows = KEYBOARD_ROWS;
}
