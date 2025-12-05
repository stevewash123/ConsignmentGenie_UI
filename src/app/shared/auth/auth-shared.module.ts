import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthMethodSelectorComponent } from './components/auth-method-selector/auth-method-selector.component';
import { AccountSecurityComponent } from './components/account-security/account-security.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AuthMethodSelectorComponent,
    AccountSecurityComponent
  ],
  exports: [
    AuthMethodSelectorComponent,
    AccountSecurityComponent
  ]
})
export class AuthSharedModule { }

// For standalone components, export them directly
export { AuthMethodSelectorComponent } from './components/auth-method-selector/auth-method-selector.component';
export { AccountSecurityComponent } from './components/account-security/account-security.component';
export * from './config/auth-consignors.config';