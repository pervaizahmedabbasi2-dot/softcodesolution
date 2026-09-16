import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-security',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './security.component.html'
})
export class SecurityComponent {
}
