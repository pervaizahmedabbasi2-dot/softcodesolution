import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard-system-health',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './system-health.component.html',
  styles: [':host{display:block;width:100%;}']
})
export class DashboardSystemHealthComponent {
  // SCS_DASHBOARD_SYSTEM_HEALTH_COMPONENT_V1

  @Input() page: any = null;
  @Input() userRole = '';

  @Output() navigateView =
    new EventEmitter<string>();

  openView(view: any): void {
    const target = String(view || '').trim();

    if (!target) {
      return;
    }

    this.navigateView.emit(target);
  }
}
