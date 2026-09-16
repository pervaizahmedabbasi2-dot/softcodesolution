import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-webhooks',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './webhooks.component.html'
})
export class WebhooksComponent {
}
