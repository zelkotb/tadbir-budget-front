import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shown when the backend returns 403 ACCESS_DENIED.
 * The error interceptor navigates here automatically.
 */
@Component({
    selector: 'app-forbidden',
    standalone: true,
    imports: [ButtonModule, RouterModule, TranslatePipe],
    templateUrl: './forbidden.component.html'
})
export class Forbidden {
    private location = Location;

    goBack(): void {
        history.back();
    }
}
