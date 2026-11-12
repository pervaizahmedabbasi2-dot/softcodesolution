import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Plus, Sparkles, CreditCard, ShieldCheck, Zap, X, Sliders, CheckCircle2, Clock } from 'lucide-angular';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: 'Production' | 'Staging' | 'Development';
  icon: any;
  updatedAt: string;
}

@Component({
  selector: 'app-dashboard-feature-flags',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './feature-flags.component.html'
})
export class FeatureFlagsComponent {
  icons = {
    Search,
    Plus,
    Sparkles,
    CreditCard,
    ShieldCheck,
    Zap,
    X,
    Sliders,
    CheckCircle2,
    Clock
  };

  searchQuery = '';
  isCreateModalOpen = false;

  newFlag = {
    name: '',
    key: '',
    description: '',
    environment: 'Production' as 'Production' | 'Staging' | 'Development',
    rolloutPercentage: 50,
    enabled: true
  };

  flags: FeatureFlag[] = [
    {
      id: 'ff_01',
      key: 'feature.ai.auto_tagging',
      name: 'AI Smart Tagging & Categorization',
      description: 'Automatically analyzes incoming inventory and applies taxonomy tags using Gemini 2.5 Flash.',
      enabled: true,
      rolloutPercentage: 100,
      environment: 'Production',
      icon: Sparkles,
      updatedAt: 'Released'
    },
    {
      id: 'ff_02',
      key: 'payment.stripe_v2',
      name: 'Stripe Elements v2 Integration',
      description: 'Upgrades payment gateway checkout flows with Apple Pay and Google Pay one-click tokenization.',
      enabled: true,
      rolloutPercentage: 100,
      environment: 'Production',
      icon: CreditCard,
      updatedAt: 'Released'
    },
    {
      id: 'ff_03',
      key: 'security.zero_trust_sessions',
      name: 'Zero-Trust Adaptive Authentication',
      description: 'Forces step-up verification when user signs in from unrecognized geolocation or ASN.',
      enabled: true,
      rolloutPercentage: 100,
      environment: 'Production',
      icon: ShieldCheck,
      updatedAt: 'Released'
    },
    {
      id: 'ff_04',
      key: 'edge.smart_cache',
      name: 'Global Edge Cloudflare Fast Routing',
      description: 'Caches tenant catalog assets at edge locations in 300+ metro points of presence.',
      enabled: true,
      rolloutPercentage: 100,
      environment: 'Production',
      icon: Zap,
      updatedAt: 'Released'
    }
  ];

  get filteredFlags(): FeatureFlag[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.flags;
    return this.flags.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.key.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
    );
  }

  toggleFlag(flag: FeatureFlag) {
    flag.enabled = !flag.enabled;
    flag.updatedAt = 'Just now';
    if (!flag.enabled) {
      flag.rolloutPercentage = 0;
    } else if (flag.rolloutPercentage === 0) {
      flag.rolloutPercentage = 25;
    }
  }

  updateRollout(flag: FeatureFlag, value: number) {
    flag.rolloutPercentage = Number(value);
    flag.enabled = flag.rolloutPercentage > 0;
    flag.updatedAt = 'Just now';
  }

  setNewFlagRollout(val: any) {
    this.newFlag.rolloutPercentage = Number(val);
  }

  openCreateModal() {
    this.newFlag = {
      name: '',
      key: 'feature.',
      description: '',
      environment: 'Production',
      rolloutPercentage: 50,
      enabled: true
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  onNameChange(name: string) {
    this.newFlag.name = name;
    if (this.newFlag.key === 'feature.' || this.newFlag.key.startsWith('feature.')) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      this.newFlag.key = 'feature.' + (slug || 'new_flag');
    }
  }

  saveFlag() {
    if (!this.newFlag.name || !this.newFlag.key) return;
    const created: FeatureFlag = {
      id: 'ff_' + Date.now().toString(36),
      key: this.newFlag.key,
      name: this.newFlag.name,
      description: this.newFlag.description || 'Custom feature rollout for multi-tenant tenants.',
      enabled: this.newFlag.enabled,
      rolloutPercentage: this.newFlag.rolloutPercentage,
      environment: this.newFlag.environment,
      icon: Zap,
      updatedAt: 'Just now'
    };
    this.flags.unshift(created);
    this.closeCreateModal();
  }
}
