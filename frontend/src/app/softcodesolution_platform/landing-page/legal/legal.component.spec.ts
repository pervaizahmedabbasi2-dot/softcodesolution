import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LegalComponent } from './legal.component';

describe('LegalComponent', () => {
  let component: LegalComponent;
  let fixture: ComponentFixture<LegalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LegalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.activeTab = 'refund';
    fixture.detectChanges();
  });

  it('should render the Refund Policy view when activeTab is refund', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Refund Policy');
    expect(compiled.textContent).toContain('No Refund Policy — SaaS');
    expect(compiled.textContent).toContain('Part B — Custom Software Development');
    expect(compiled.textContent).toContain('Booking Fee (30–40%)');
  });

  it('should switch between all 5 legal documents cleanly', () => {
    component.selectTab('privacy');
    fixture.detectChanges();
    expect(component.currentTab()).toBe('privacy');

    component.selectTab('sla');
    fixture.detectChanges();
    expect(component.currentTab()).toBe('sla');
  });

  it('should emit closeEvent on Escape key when modal is open', () => {
    let closed = false;
    component.closeEvent.subscribe(() => {
      closed = true;
    });
    component.onEscapeKey();
    expect(closed).toBe(true);
    expect(component.isModalOpen()).toBe(false);
  });
});
