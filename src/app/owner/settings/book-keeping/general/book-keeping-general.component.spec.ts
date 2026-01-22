import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookKeepingGeneralComponent } from './book-keeping-general.component';

describe('BookKeepingGeneralComponent', () => {
  let component: BookKeepingGeneralComponent;
  let fixture: ComponentFixture<BookKeepingGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookKeepingGeneralComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BookKeepingGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});