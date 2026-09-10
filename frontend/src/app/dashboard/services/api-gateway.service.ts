import { Injectable } from '@angular/core';

export interface GatewayApiKey {
  id: string;
  name: string;
  key_prefix?: string;
  keyMasked?: string;
  tenant_id?: string;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  created_at?: string;
  updated_at?: string;
  last_used_at?: string | null;
  expires_at?: string | null;
}

export interface GatewaySecurityPolicy {
  tenant_id: string;
  enabled: boolean;
  allowed_ips: string[];
  allowed_origins: string[];
  require_origin: boolean;
  max_body_bytes: number;
}

@Injectable({ providedIn: 'root' })
export class ApiGatewayService {
  private readonly apiBase = '/api';

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(
      this.apiBase + path,
      {
        credentials: 'same-origin',
        cache: 'no-store',
        ...init,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(init.headers || {})
        }
      }
    );

    const text = await response.text();

    let payload: any = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        `Gateway request failed (${response.status})`;

      throw new Error(message);
    }

    return payload as T;
  }

  async listApiKeys(): Promise<GatewayApiKey[]> {
    const result: any = await this.request(
      '/superadmin/api-gateway/keys'
    );

    return Array.isArray(result?.keys)
      ? result.keys
      : [];
  }

  async createApiKey(payload: {
    name: string;
    tenant_id?: string;
    scopes: string[];
    expires_at?: string;
  }): Promise<any> {
    return this.request(
      '/superadmin/api-gateway/keys',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  }

  async revokeApiKey(id: string): Promise<any> {
    return this.request(
      '/superadmin/api-gateway/keys/revoke',
      {
        method: 'POST',
        body: JSON.stringify({ id })
      }
    );
  }

  async rotateApiKey(id: string): Promise<any> {
    return this.request(
      '/superadmin/api-gateway/keys/rotate',
      {
        method: 'POST',
        body: JSON.stringify({ id })
      }
    );
  }

  async loadSecurityPolicy(): Promise<GatewaySecurityPolicy> {
    const result: any = await this.request(
      '/superadmin/api-gateway/security-policy'
    );

    return result?.policy as GatewaySecurityPolicy;
  }

  async saveSecurityPolicy(
    policy: Partial<GatewaySecurityPolicy>
  ): Promise<GatewaySecurityPolicy> {
    const result: any = await this.request(
      '/superadmin/api-gateway/security-policy',
      {
        method: 'PUT',
        body: JSON.stringify(policy)
      }
    );

    return result?.policy as GatewaySecurityPolicy;
  }

  async verifyApiKey(secret: string): Promise<any> {
    return this.request(
      '/gateway/security/probe',
      {
        headers: {
          'X-SCS-API-Key': secret
        }
      }
    );
  }


  async listRateLimitPolicies(): Promise<any[]> {
    const result: any = await this.request(
      '/superadmin/api-gateway/rate-limits'
    );

    return Array.isArray(result?.policies)
      ? result.policies
      : [];
  }



  async saveRateLimitPolicy(payload: {
    tenant_id?: string;
    api_key_id?: string | null;
    path_pattern: string;
    window_seconds: number;
    max_requests: number;
    enabled: boolean;
  }): Promise<any> {
    return this.request(
      '/superadmin/api-gateway/rate-limits',
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      }
    );
  }

}
