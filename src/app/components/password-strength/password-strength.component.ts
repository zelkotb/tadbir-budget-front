import { Component, OnDestroy, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

const RULES = [
    { key: 'validation.password_strength.min_8',     check: (v: string) => v.length >= 8 },
    { key: 'validation.password_strength.max_128',   check: (v: string) => v.length <= 128 },
    { key: 'validation.password_strength.uppercase', check: (v: string) => /[A-Z]/.test(v) },
    { key: 'validation.password_strength.digit',     check: (v: string) => /[0-9]/.test(v) },
    { key: 'validation.password_strength.special',   check: (v: string) => /[!@#$%^&*()\-_=+[\]{}|;':",./<>?\\]/.test(v) },
    { key: 'validation.password_strength.no_space',  check: (v: string) => v.length > 0 && !/\s/.test(v) },
] as const;

@Component({
    selector: 'app-password-strength',
    standalone: true,
    imports: [TranslatePipe],
    template: `
        @if (dirty()) {
            <ul class="mt-2 flex flex-col gap-1 list-none p-0 m-0">
                @for (rule of rules(); track rule.key) {
                    <li class="flex items-center gap-1.5 text-xs"
                        [class]="rule.ok ? 'text-green-500' : 'text-muted-color'">
                        <i class="pi" [class]="rule.ok ? 'pi-check-circle' : 'pi-circle'"></i>
                        {{ rule.key | translate }}
                    </li>
                }
            </ul>
        }
    `
})
export class PasswordStrengthComponent implements OnDestroy {
    readonly control = input.required<AbstractControl>();

    private readonly _value = signal('');
    private readonly _dirty = signal(false);
    private _sub?: Subscription;

    readonly dirty = this._dirty.asReadonly();
    readonly rules = computed(() => {
        const v = this._value();
        return RULES.map(r => ({ key: r.key, ok: r.check(v) }));
    });

    constructor() {
        effect(() => {
            this._sub?.unsubscribe();
            const ctrl = this.control();
            const init = ctrl.value ?? '';
            this._value.set(init);
            if (init.length > 0) this._dirty.set(true);
            this._sub = ctrl.valueChanges.subscribe(v => {
                this._value.set(v ?? '');
                if ((v ?? '').length > 0) this._dirty.set(true);
            });
        });
    }

    ngOnDestroy(): void { this._sub?.unsubscribe(); }
}
