import { Injectable, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    readonly isLoading = signal(false);

    private _count   = 0;
    private _hideTimer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        // Safety net: a navigation boundary must never inherit a spinner left
        // behind by a request whose decrement was missed, or by the blocking
        // app-initializer's i18n fetch that latched the overlay before it mounted.
        // Once a navigation settles, force the loader back to a clean state.
        inject(Router).events.subscribe((e) => {
            if (
                e instanceof NavigationEnd ||
                e instanceof NavigationCancel ||
                e instanceof NavigationError ||
                e instanceof NavigationSkipped
            ) {
                this.reset();
            }
        });
    }

    increment(): void {
        // Cancel a pending hide so rapid sequential requests don't flicker off
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        this._count++;
        this.isLoading.set(true);
    }

    decrement(): void {
        this._count = Math.max(0, this._count - 1);
        if (this._count === 0) {
            // Debounce the hide — prevents a brief off-flash when one request
            // ends and the next starts within the same JS task queue tick.
            this._hideTimer = setTimeout(() => {
                this.isLoading.set(false);
                this._hideTimer = null;
            }, 100);
        }
    }

    /** Force the overlay off and zero the in-flight counter. */
    reset(): void {
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        this._count = 0;
        this.isLoading.set(false);
    }
}
