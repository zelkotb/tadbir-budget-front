import { Component, OnDestroy, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-char-counter',
    standalone: true,
    template: `
        <span class="text-xs" [class]="over() ? 'text-red-500' : 'text-muted-color'">
            {{ len() }} / {{ max() }}
        </span>
    `
})
export class CharCounterComponent implements OnDestroy {
    readonly control = input.required<AbstractControl>();
    readonly max     = input.required<number>();

    private readonly _len = signal(0);
    private _sub?: Subscription;

    readonly len  = this._len.asReadonly();
    readonly over = computed(() => this._len() >= this.max());

    constructor() {
        effect(() => {
            this._sub?.unsubscribe();
            const ctrl = this.control();
            this._len.set(ctrl.value?.length ?? 0);
            this._sub = ctrl.valueChanges.subscribe(v => this._len.set(v?.length ?? 0));
        });
    }

    ngOnDestroy(): void { this._sub?.unsubscribe(); }
}
