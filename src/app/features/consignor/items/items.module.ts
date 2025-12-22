import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ItemListComponent } from './item-list/item-list.component';
import { ItemCardComponent } from './item-card/item-card.component';
import { MockConsignorItemService } from './services/mock-consignor-item.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ItemListComponent,
    ItemCardComponent
  ],
  exports: [
    ItemListComponent,
    ItemCardComponent
  ],
  providers: [
    MockConsignorItemService
  ]
})
export class ItemsModule { }