import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '@/app/pages/auth/auth.service';

/**
 * Structural directive that shows the host element only when the authenticated
 * user holds at least one of the required roles.
 *
 * Usage:
 *   <div *hasAnyRole="[Roles.ADMIN, Roles.DEPARTMENT_MANAGER]">restricted content</div>
 *   <div *hasAnyRole="['ROLE_ADMIN']">admin-only content</div>
 */
@Directive({
    selector: '[hasAnyRole]',
    standalone: true
})
export class HasAnyRoleDirective {
    readonly hasAnyRole = input.required<string[]>();

    private readonly _vcr  = inject(ViewContainerRef);
    private readonly _tmpl = inject(TemplateRef<unknown>);
    private readonly _auth = inject(AuthService);

    private _rendered = false;

    constructor() {
        effect(() => {
            const roles    = this.hasAnyRole();
            const user     = this._auth.currentUser();
            const hasRole  = !!user && roles.some((r) => user.roles.includes(r));

            if (hasRole && !this._rendered) {
                this._vcr.createEmbeddedView(this._tmpl);
                this._rendered = true;
            } else if (!hasRole && this._rendered) {
                this._vcr.clear();
                this._rendered = false;
            }
        });
    }
}
