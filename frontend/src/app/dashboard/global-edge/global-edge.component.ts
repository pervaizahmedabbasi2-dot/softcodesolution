import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Activity, Globe, Server, Zap, Shield, ChevronRight, ActivitySquare, Database, CloudRain, ShieldAlert } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-global-edge',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './global-edge.component.html'
})
export class GlobalEdgeComponent {
  @Input() activeView = '';

  readonly icons = {
    Globe, Server, Zap, Activity, Shield, ChevronRight, ActivitySquare, Database, CloudRain, ShieldAlert
  };

  regions = [
    { name: 'us-east-1', location: 'N. Virginia', latency: 12, status: 'healthy', load: 45, users: '1.2M' },
    { name: 'eu-west-1', location: 'Ireland', latency: 18, status: 'healthy', load: 38, users: '850K' },
    { name: 'ap-southeast-1', location: 'Singapore', latency: 24, status: 'healthy', load: 62, users: '2.1M' },
    { name: 'sa-east-1', location: 'São Paulo', latency: 45, status: 'warning', load: 85, users: '420K' }
  ];

  metrics = [
    { label: 'Global Request Rate', value: '45,231', unit: 'req/s', trend: '+12%', positive: true },
    { label: 'Avg Edge Latency', value: '28', unit: 'ms', trend: '-5ms', positive: true },
    { label: 'Threats Blocked', value: '1.2M', unit: '/hr', trend: '+2%', positive: false },
    { label: 'Active Replicas', value: '128', unit: 'nodes', trend: 'stable', positive: true }
  ];
}
