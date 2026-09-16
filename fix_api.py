import re

with open('frontend/src/app/dashboard/services/dashboard-api.service.ts', 'r') as f:
    content = f.read()

# Replace direct response.json() calls with a safer wrapper
# Or simply define a safe parse
replacement = """
  private async safeJson(response: Response, fallback: any = null): Promise<any> {
    try {
      const text = await response.text();
      if (!text || text.trim().startsWith('<')) {
        return fallback;
      }
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  private async requestJSON<T = any>(path: string, fallback: T): Promise<T> {
"""

content = content.replace('  private async requestJSON<T = any>(path: string, fallback: T): Promise<T> {', replacement)

# Replace response.json() with this.safeJson(response)
content = re.sub(r'await response\.json\(\)', 'await this.safeJson(response)', content)

# But what if safeJson returns null?
# Let's just fix the requestJSON first:
replacement_rj = """
  private async requestJSON<T = any>(path: string, fallback: T): Promise<T> {
    try {
      const response = await fetch(this.apiBase + path, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        return fallback;
      }
      const text = await response.text();
      if (!text || text.trim().startsWith('<')) {
         return fallback;
      }
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  }
"""
content = re.sub(r'  private async requestJSON<T = any>\(path: string, fallback: T\): Promise<T> \{[\s\S]*?    \} catch \{\n      return fallback;\n    \}\n  \}', replacement_rj.strip(), content)


with open('frontend/src/app/dashboard/services/dashboard-api.service.ts', 'w') as f:
    f.write(content)

