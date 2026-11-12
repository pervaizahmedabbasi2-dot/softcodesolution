import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, Network, Send, CheckCircle2, XCircle, RefreshCcw, Copy, ExternalLink, X, Clock, ShieldCheck, AlertTriangle } from 'lucide-angular';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT';
  status: 'active' | 'failing' | 'paused';
  eventsCount: number;
  successRate: number;
  callsPerDay: string;
  topics: string[];
  secretKey: string;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  endpointName: string;
  topic: string;
  status: number;
  durationMs: number;
  timestamp: string;
  payload: string;
  response: string;
}

@Component({
  selector: 'app-dashboard-webhooks',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './webhooks.component.html'
})
export class WebhooksComponent {
  // Icons reference
  icons = {
    Plus,
    Network,
    Send,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Copy,
    ExternalLink,
    X,
    Clock,
    ShieldCheck,
    AlertTriangle
  };

  endpoints: WebhookEndpoint[] = [
    {
      id: 'ep_sf_01',
      name: 'Salesforce Enterprise Sync',
      url: 'https://api.salesforce.com/services/data/v60.0/sobjects/Account',
      method: 'POST',
      status: 'active',
      eventsCount: 4,
      successRate: 99.9,
      callsPerDay: '14.2k',
      topics: ['tenant.created', 'subscription.updated'],
      secretKey: 'whsec_sf_9201948102948',
      createdAt: '2026-03-12'
    },
    {
      id: 'ep_erp_02',
      name: 'Legacy ERP Notification Gateway',
      url: 'https://erp.internal.acme.corp/webhooks/billing_update',
      method: 'POST',
      status: 'failing',
      eventsCount: 2,
      successRate: 82.1,
      callsPerDay: '840',
      topics: ['payment.failed', 'invoice.paid'],
      secretKey: 'whsec_erp_44820192841',
      createdAt: '2026-06-20'
    },
    {
      id: 'ep_zap_03',
      name: 'Zapier Automation Relay',
      url: 'https://hooks.zapier.com/hooks/catch/91284/b9d28s/',
      method: 'POST',
      status: 'active',
      eventsCount: 3,
      successRate: 100.0,
      callsPerDay: '3.6k',
      topics: ['tenant.created', 'user.invited', 'license.assigned'],
      secretKey: 'whsec_zap_8830192419',
      createdAt: '2026-08-01'
    }
  ];

  deliveryLogs: WebhookDeliveryLog[] = [
    {
      id: 'del_9901',
      endpointName: 'Salesforce Enterprise Sync',
      topic: 'tenant.created',
      status: 200,
      durationMs: 142,
      timestamp: 'Just now',
      payload: '{\n  "event": "tenant.created",\n  "tenant_id": "tenant-89102",\n  "company": "Apex Dynamics Ltd",\n  "plan": "Enterprise Scale"\n}',
      response: '{\n  "success": true,\n  "salesforce_id": "0015g00000XyZ12"\n}'
    },
    {
      id: 'del_9902',
      endpointName: 'Legacy ERP Notification Gateway',
      topic: 'payment.failed',
      status: 502,
      durationMs: 4120,
      timestamp: '4 minutes ago',
      payload: '{\n  "event": "payment.failed",\n  "invoice_id": "inv_88219",\n  "amount": 2400,\n  "currency": "USD"\n}',
      response: 'Bad Gateway: ERP endpoint connection timeout'
    },
    {
      id: 'del_9903',
      endpointName: 'Zapier Automation Relay',
      topic: 'user.invited',
      status: 200,
      durationMs: 88,
      timestamp: '18 minutes ago',
      payload: '{\n  "event": "user.invited",\n  "email": "sarah.cto@apex.io",\n  "role": "admin"\n}',
      response: '{\n  "status": "received",\n  "zap_id": "z_11209"\n}'
    }
  ];

  // Modals state
  isCreateModalOpen = false;
  isTestModalOpen = false;
  isLogModalOpen = false;

  // Create form draft
  newEndpoint = {
    name: '',
    url: '',
    topics: ['tenant.created', 'subscription.updated']
  };

  // Test event state
  testSelectedEndpointId = 'ep_sf_01';
  testTopic = 'tenant.created';
  isSendingTest = false;
  testResult: { ok: boolean; status: number; duration: number; message: string } | null = null;

  // Selected Log state
  selectedLog: WebhookDeliveryLog | null = null;
  copiedSecretId: string | null = null;

  availableTopics = [
    { key: 'tenant.created', label: 'tenant.created' },
    { key: 'subscription.updated', label: 'subscription.updated' },
    { key: 'payment.failed', label: 'payment.failed' },
    { key: 'invoice.paid', label: 'invoice.paid' },
    { key: 'user.invited', label: 'user.invited' },
    { key: 'security.threat_alert', label: 'security.threat_alert' }
  ];

  openCreateModal() {
    this.newEndpoint = {
      name: '',
      url: 'https://',
      topics: ['tenant.created']
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  toggleTopic(topicKey: string) {
    if (this.newEndpoint.topics.includes(topicKey)) {
      this.newEndpoint.topics = this.newEndpoint.topics.filter(t => t !== topicKey);
    } else {
      this.newEndpoint.topics.push(topicKey);
    }
  }

  saveEndpoint() {
    if (!this.newEndpoint.name || !this.newEndpoint.url) return;
    const created: WebhookEndpoint = {
      id: 'ep_' + Date.now().toString(36),
      name: this.newEndpoint.name,
      url: this.newEndpoint.url,
      method: 'POST',
      status: 'active',
      eventsCount: this.newEndpoint.topics.length,
      successRate: 100.0,
      callsPerDay: '0',
      topics: [...this.newEndpoint.topics],
      secretKey: 'whsec_' + Math.random().toString(36).substring(2, 14),
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.endpoints.unshift(created);
    this.closeCreateModal();
  }

  openTestModal(endpointId?: string) {
    if (endpointId) {
      this.testSelectedEndpointId = endpointId;
    } else if (this.endpoints.length > 0) {
      this.testSelectedEndpointId = this.endpoints[0].id;
    }
    this.testResult = null;
    this.isTestModalOpen = true;
  }

  closeTestModal() {
    this.isTestModalOpen = false;
    this.testResult = null;
  }

  sendTestEvent() {
    this.isSendingTest = true;
    this.testResult = null;

    setTimeout(() => {
      this.isSendingTest = false;
      const target = this.endpoints.find(e => e.id === this.testSelectedEndpointId);
      const isFailing = target?.status === 'failing';
      const status = isFailing ? 502 : 200;
      const duration = Math.floor(Math.random() * 80) + 70;

      this.testResult = {
        ok: !isFailing,
        status: status,
        duration: duration,
        message: isFailing
          ? 'Destination returned HTTP 502 Bad Gateway (Upstream Server Timeout)'
          : `HTTP ${status} OK — Webhook acknowledged in ${duration}ms`
      };

      // Add to delivery logs
      this.deliveryLogs.unshift({
        id: 'del_' + Date.now().toString(36),
        endpointName: target ? target.name : 'Unknown Endpoint',
        topic: this.testTopic,
        status: status,
        durationMs: duration,
        timestamp: 'Just now',
        payload: JSON.stringify({
          event: this.testTopic,
          timestamp: new Date().toISOString(),
          simulation: true,
          tenant: 'tenant-demo-881'
        }, null, 2),
        response: isFailing
          ? '502 Bad Gateway: Connection refused on port 443'
          : '{\n  "received": true,\n  "status": "ack"\n}'
      });
    }, 600);
  }

  retryDelivery(log: WebhookDeliveryLog) {
    log.status = 200;
    log.durationMs = 94;
    log.timestamp = 'Just now (Retried)';
    log.response = '{\n  "status": "success",\n  "retry": true\n}';
  }

  viewLog(log: WebhookDeliveryLog) {
    this.selectedLog = log;
    this.isLogModalOpen = true;
  }

  closeLogModal() {
    this.isLogModalOpen = false;
    this.selectedLog = null;
  }

  copySecret(secret: string, id: string) {
    navigator.clipboard?.writeText(secret);
    this.copiedSecretId = id;
    setTimeout(() => {
      this.copiedSecretId = null;
    }, 2000);
  }
}
