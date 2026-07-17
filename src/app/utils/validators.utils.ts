import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * SECURITY Password strength validator
 * Enforces: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.
 * Matches common backend password policies so users can't bypass them via the API.
 */
export function strongPasswordValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
        const v: string = ctrl.value ?? '';
        const ok =
            v.length >= 8 &&
            v.length <= 128 &&
            /[A-Z]/.test(v) &&
            /[0-9]/.test(v) &&
            /[!@#$%^&*()\-_=+[\]{}|;':",./<>?\\]/.test(v) &&
            !/\s/.test(v);
        return ok ? null : { weakPassword: true };
    };
}

/**
 * SECURITY Cross-field password-match validator (applied at group level)
 * Prevents the value from being submitted if the two fields differ.
 */
export function passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const pw  = group.get('password')?.value;
        const cpw = group.get('confirmPassword')?.value;
        return pw === cpw ? null : { passwordMismatch: true };
    };
}
