import { MonoTypeOperatorFunction, defer, timer } from 'rxjs';
import { delayWhen } from 'rxjs/operators';

/**
 * Holds emissions back until at least `ms` milliseconds have passed since
 * subscription. Used to keep fast-resolving loading states (table skeletons,
 * spinners) on screen long enough for the user to actually perceive them —
 * without it, a sub-100ms response makes the skeleton flash invisibly.
 */
export function minDuration<T>(ms: number): MonoTypeOperatorFunction<T> {
    return (source) =>
        defer(() => {
            const start = Date.now();
            return source.pipe(delayWhen(() => timer(Math.max(0, ms - (Date.now() - start)))));
        });
}
