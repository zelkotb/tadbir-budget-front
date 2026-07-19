import { Routes } from '@angular/router';
import { Login } from './login/login.component';
import { Error } from './error/error.component';
import { AccountDisabled } from './account-disabled/account-disabled.component';

export default [
    { path: 'login',            component: Login           },
    { path: 'error',            component: Error           },
    { path: 'account-disabled', component: AccountDisabled },
    { path: '**',               redirectTo: 'login'        }
] as Routes;
