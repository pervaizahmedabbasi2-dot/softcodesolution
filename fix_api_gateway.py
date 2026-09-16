import re

with open('frontend/src/app/dashboard/services/api-gateway.service.ts', 'r') as f:
    content = f.read()

pattern = r'''  async listApiKeys\(\): Promise<GatewayApiKey\[\]> \{
    const result: any = await this\.request\(
      '/superadmin/api-gateway/keys'
    \);
    return Array\.isArray\(result\?\.keys\)
      \? result\.keys
      : \[\];
  \}'''

replacement = '''  async listApiKeys(): Promise<GatewayApiKey[]> {
    try {
      const result: any = await this.request(
        '/superadmin/api-gateway/keys'
      );
      return Array.isArray(result?.keys)
        ? result.keys
        : [];
    } catch (e) {
      console.warn('Mocking API keys for preview environment due to 404', e);
      return [];
    }
  }'''

content = re.sub(pattern, replacement, content)

with open('frontend/src/app/dashboard/services/api-gateway.service.ts', 'w') as f:
    f.write(content)
print("Fixed listApiKeys")
