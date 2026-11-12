import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Layers, Activity, CheckCircle2, AlertTriangle, RefreshCcw, Network, Zap, Shield, Copy, Check } from 'lucide-angular';
import { BackendService, MicroserviceItem } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-services-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './services-catalog.component.html'
})
export class DashboardServicesCatalogComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Layers,
    Activity,
    CheckCircle2,
    AlertTriangle,
    RefreshCcw,
    Network,
    Zap,
    Shield,
    Copy,
    Check
  };

  services: MicroserviceItem[] = [];
  isLoading = false;
  copiedId: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadCatalog();
  }

  async loadCatalog(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.backend.getServicesCatalog();
      this.services = res.services || [];
    } finally {
      this.isLoading = false;
    }
  }

  async toggleStatus(service: MicroserviceItem): Promise<void> {
    const nextStatus = service.status === 'HEALTHY' ? 'MAINTENANCE' : 'HEALTHY';
    service.status = nextStatus;
    await this.backend.toggleService(service.id, nextStatus);
  }

  copyEndpoint(srv: MicroserviceItem): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://api.softcodesolution.com${srv.endpoint}`);
      this.copiedId = srv.id;
      setTimeout(() => {
        if (this.copiedId === srv.id) this.copiedId = null;
      }, 2000);
    }
  }
}
