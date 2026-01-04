import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store-profile-basic-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="store-profile-basic-info">
      <h2>Basic Store Information</h2>
      <form>
        <div class="form-group">
          <label for="storeName">Store Name</label>
          <input type="text" id="storeName" [(ngModel)]="storeProfile.name" name="storeName">
        </div>
        <div class="form-group">
          <label for="storeDescription">Description</label>
          <textarea id="storeDescription" [(ngModel)]="storeProfile.description" name="storeDescription"></textarea>
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  `,
  styleUrls: ['./store-profile-basic-info.component.scss']
})
export class StoreProfileBasicInfoComponent {
  storeProfile = {
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  };

  onSave() {
    // Save implementation
  }
}