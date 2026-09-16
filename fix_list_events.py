import re

with open('frontend/src/app/dashboard/services/dashboard-api.service.ts', 'r') as f:
    content = f.read()

# Replace listRecoveryEvents
old_func = """  async listRecoveryEvents(limit = 100): Promise<any[]> {
    try {
      const response = await fetch(
        this.apiBase + '/superadmin/recovery/events?limit=' + encodeURIComponent(String(limit)),
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        },
      );
      const result = await response.json();
      if (!response.ok) {
        return [];
      }

      return Array.isArray(result?.events) ? result.events : [];
    } catch (error) {
      console.error('[DashboardApi] recovery events failed', error);

      return [];
    }
  }"""

new_func = """  async listRecoveryEvents(limit = 100): Promise<any[]> {
    const result: any = await this.requestJSON(`/superadmin/recovery/events?limit=${limit}`, {
      ok: false,
      events: [],
    });
    return Array.isArray(result?.events) ? result.events : [];
  }"""

content = content.replace(old_func, new_func)

with open('frontend/src/app/dashboard/services/dashboard-api.service.ts', 'w') as f:
    f.write(content)
