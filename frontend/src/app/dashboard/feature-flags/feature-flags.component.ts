import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-feature-flags',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './feature-flags.component.html'
})
export class FeatureFlagsComponent {
}
