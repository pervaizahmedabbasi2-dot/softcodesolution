import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, BookOpen, Code, Terminal, FileText, Search, ExternalLink, ShieldCheck, ChevronRight, Check } from 'lucide-angular';

export interface DocArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  readTime: string;
  updatedAt: string;
  codeSnippet?: string;
}

@Component({
  selector: 'app-dashboard-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './knowledge-base.component.html'
})
export class DashboardKnowledgeBaseComponent implements OnInit {
  readonly icons = {
    BookOpen,
    Code,
    Terminal,
    FileText,
    Search,
    ExternalLink,
    ShieldCheck,
    ChevronRight,
    Check
  };

  searchQuery = '';
  selectedCategory = 'all';

  articles: DocArticle[] = [
    {
      id: 'doc-1',
      category: 'API & Integration',
      title: 'Zero-Trust mTLS and HMAC Webhook Verification',
      description: 'Implement end-to-end cryptographic payload validation using Ed25519 signatures and symmetric secrets.',
      readTime: '4 min read',
      updatedAt: '2 days ago',
      codeSnippet: `const signature = crypto.createHmac('sha256', WEBHOOK_SECRET)\n  .update(rawBody)\n  .digest('hex');\nif (signature !== req.headers['x-scs-signature']) throw new UnauthorizedError();`
    },
    {
      id: 'doc-2',
      category: 'Multi-Tenant Architecture',
      title: 'Tenant Isolation & Database Sharding Protocols',
      description: 'Understanding how Firestore document separation and Cloud SQL row-level security (RLS) enforce tenant privacy.',
      readTime: '6 min read',
      updatedAt: '1 week ago'
    },
    {
      id: 'doc-3',
      category: 'Licensing & Compliance',
      title: 'Hardware Fingerprint Binding & License Handshake',
      description: 'Step-by-step device telemetry collection: CPU ID, MAC address hashing, and cryptographic license renewal.',
      readTime: '5 min read',
      updatedAt: '3 weeks ago',
      codeSnippet: `const handshake = await client.verifyLicense({\n  key: 'SCS-ENTP-9842-8819-4401',\n  fingerprint: 'hw_99a8b1c4e2'\n});`
    },
    {
      id: 'doc-4',
      category: 'Disaster Recovery',
      title: 'Triple-Backup Automated Geographic Failover Runbook',
      description: 'Recovery time objective (RTO < 30s) and recovery point objective (RPO = 0s) failover manual.',
      readTime: '8 min read',
      updatedAt: '1 month ago'
    }
  ];

  filteredArticles: DocArticle[] = [];

  ngOnInit(): void {
    this.filteredArticles = [...this.articles];
  }

  applyFilter(): void {
    let list = [...this.articles];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    if (this.selectedCategory !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === this.selectedCategory.toLowerCase());
    }
    this.filteredArticles = list;
  }
}
