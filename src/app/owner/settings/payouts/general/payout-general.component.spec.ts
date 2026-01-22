import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayoutGeneralComponent } from './payout-general.component';

describe('PayoutGeneralComponent', () => {
  let component: PayoutGeneralComponent;
  let fixture: ComponentFixture<PayoutGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayoutGeneralComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PayoutGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});