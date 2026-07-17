import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-error',
    standalone: true,
    imports: [ButtonModule, RouterModule, TranslatePipe],
    templateUrl: './error.component.html'
})
export class Error {}