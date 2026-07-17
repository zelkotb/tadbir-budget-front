import { Injectable, signal } from '@angular/core';

type KeyboardTarget = HTMLInputElement | HTMLTextAreaElement;

@Injectable({ providedIn: 'root' })
export class VirtualKeyboardService {
    readonly visible = signal(false);

    private _target: KeyboardTarget | null = null;

    open(el: KeyboardTarget): void {
        this._target = el;
        this.visible.set(true);
    }

    /** The native value setter for the target's element type (input vs textarea). */
    private nativeValueSetter(el: KeyboardTarget): ((v: string) => void) | undefined {
        const proto = el instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        return Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    }

    close(): void {
        this.visible.set(false);
        this._target = null;
    }

    /** Insert a character at the current cursor position of the focused input */
    type(char: string): void {
        const el = this._target;
        if (!el) return;

        const start = el.selectionStart ?? el.value.length;
        const end   = el.selectionEnd   ?? el.value.length;

        const newValue = el.value.slice(0, start) + char + el.value.slice(end);

        /**
         * We use the native value setter (for the element's own prototype —
         * input or textarea) before dispatching the event so Angular's
         * DefaultValueAccessor (which listens to the 'input' event) picks up the
         * change and updates the FormControl. Setting `el.value` directly would
         * bypass the event listener.
         */
        this.nativeValueSetter(el)?.call(el, newValue);

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.setSelectionRange(start + char.length, start + char.length);
        el.focus();
    }

    /** Delete the character before the cursor (or the current selection) */
    backspace(): void {
        const el = this._target;
        if (!el) return;

        const start = el.selectionStart ?? el.value.length;
        const end   = el.selectionEnd   ?? el.value.length;

        const newValue =
            start !== end
                ? el.value.slice(0, start) + el.value.slice(end)          // delete selection
                : el.value.slice(0, Math.max(0, start - 1)) + el.value.slice(end); // delete one char

        this.nativeValueSetter(el)?.call(el, newValue);

        el.dispatchEvent(new Event('input', { bubbles: true }));

        const newPos = start !== end ? start : Math.max(0, start - 1);
        el.setSelectionRange(newPos, newPos);
        el.focus();
    }
}
