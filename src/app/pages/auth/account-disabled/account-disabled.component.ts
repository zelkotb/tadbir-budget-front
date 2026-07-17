import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shown when the backend returns 403 ACCOUNT_DISABLED.
 * The error interceptor forces a logout before navigating here.
 */
@Component({
    selector: 'app-account-disabled',
    standalone: true,
    imports: [ButtonModule, RouterModule, TranslatePipe],
    templateUrl: './account-disabled.component.html'
})
export class AccountDisabled {}
