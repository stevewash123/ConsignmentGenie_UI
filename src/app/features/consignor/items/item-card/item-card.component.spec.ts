import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemCardComponent } from './item-card.component';
import { ConsignorItemSummary } from '../models/consignor-item.model';

describe('ItemCardComponent', () => {
  let component: ItemCardComponent;
  let fixture: ComponentFixture<ItemCardComponent>;

  const mockItem: ConsignorItemSummary = {
    id: '1',
    name: 'Test Item',
    thumbnailUrl: 'https://example.com/image.jpg',
    listedPrice: 100.00,
    consignorEarnings: 60.00,
    status: 'available',
    listedDate: new Date('2024-01-01'),
    daysListed: 30
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemCardComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display item name', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.item-name').textContent).toContain('Test Item');
  });

  it('should display correct prices', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.listed-price').textContent).toContain('$100.00');
    expect(compiled.querySelector('.earnings').textContent).toContain('$60.00');
  });

  it('should emit itemClick when card is clicked', () => {
    spyOn(component.itemClick, 'emit');

    const cardElement = fixture.nativeElement.querySelector('.item-card');
    cardElement.click();

    expect(component.itemClick.emit).toHaveBeenCalledWith(mockItem);
  });

  it('should return correct status class for available item', () => {
    expect(component.getStatusClass()).toBe('status-available');
  });

  it('should return correct status class for sold item', () => {
    component.item = { ...mockItem, status: 'sold' };
    expect(component.getStatusClass()).toBe('status-sold');
  });

  it('should return correct status class for returned item', () => {
    component.item = { ...mockItem, status: 'returned' };
    expect(component.getStatusClass()).toBe('status-returned');
  });

  it('should return correct status class for expired item', () => {
    component.item = { ...mockItem, status: 'expired' };
    expect(component.getStatusClass()).toBe('status-expired');
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon()).toBe('🟢');

    component.item = { ...mockItem, status: 'sold' };
    expect(component.getStatusIcon()).toBe('✓');

    component.item = { ...mockItem, status: 'returned' };
    expect(component.getStatusIcon()).toBe('↩️');

    component.item = { ...mockItem, status: 'expired' };
    expect(component.getStatusIcon()).toBe('⚠️');
  });

  it('should return correct status text', () => {
    expect(component.getStatusText()).toBe('Available');

    component.item = { ...mockItem, status: 'sold' };
    expect(component.getStatusText()).toBe('Sold');

    component.item = { ...mockItem, status: 'returned' };
    expect(component.getStatusText()).toBe('Returned');

    component.item = { ...mockItem, status: 'expired' };
    expect(component.getStatusText()).toBe('Expired');
  });

  it('should return correct date display text for available item', () => {
    expect(component.getDateDisplayText()).toContain('Listed 30 days ago');
  });

  it('should return correct date display text for sold item', () => {
    const soldDate = new Date('2024-01-15');
    component.item = { ...mockItem, status: 'sold', soldDate };

    expect(component.getDateDisplayText()).toContain('Sold');
  });

  it('should return correct date display text for expired item', () => {
    component.item = { ...mockItem, status: 'expired' };
    expect(component.getDateDisplayText()).toBe('90-day period ended');
  });

  it('should handle singular day correctly', () => {
    component.item = { ...mockItem, daysListed: 1 };
    expect(component.getDateDisplayText()).toContain('Listed 1 day ago');
  });

  it('should generate correct image alt text', () => {
    expect(component.getImageAlt()).toBe('Test Item thumbnail');
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: {
        src: ''
      }
    } as any;

    component.onImageError(mockEvent);
    expect(mockEvent.target.src).toBe('assets/images/placeholder-item.png');
  });
});