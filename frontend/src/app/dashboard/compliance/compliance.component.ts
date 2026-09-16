import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-compliance',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './compliance.component.html'
})
export class ComplianceComponent {
}
