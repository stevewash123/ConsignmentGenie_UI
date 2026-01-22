import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayoutDirectDepositComponent } from './payout-direct-deposit.component';

describe('PayoutDirectDepositComponent', () => {
  let component: PayoutDirectDepositComponent;
  let fixture: ComponentFixture<PayoutDirectDepositComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayoutDirectDepositComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PayoutDirectDepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});