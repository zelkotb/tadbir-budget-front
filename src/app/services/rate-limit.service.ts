import { Injectable, signal } from '@angular/core';

/**
 * Tracks the global rate-limit countdown from Retry-After response headers.
 * Components (login, signup) read `secondsRemaining()` to disable their
 * submit buttons and show the countdown label while the server-imposed wait
 * is active.
 */
@Injectable({ providedIn: 'root' })
export class RateLimitService {
    readonly secondsRemaining = signal(0);

    private _interval?: ReturnType<typeof setInterval>;

    /** Start (or restart) the countdown. Called by the error interceptor on HTTP 429. */
    start(seconds: number): void {
        clearInterval(this._interval);
        this.secondsRemaining.set(Math.max(1, seconds));

        this._interval = setInterval(() => {
            const next = this.secondsRemaining() - 1;
            if (next <= 0) {
                clearInterval(this._interval);
                this.secondsRemaining.set(0);
            } else {
                this.secondsRemaining.set(next);
            }
        }, 1000);
    }
}
