import re

with open('frontend/src/app/dashboard/dashboard.component.ts', 'r') as f:
    text = f.read()

pattern = r"  async clientPopupAccessAction\(action: string, endpoint: string\): Promise<void> \{.*?  \}\n"
new_func = """  async clientPopupAccessAction(action: string, endpoint: string): Promise<void> {
    if (!this.clientPopup) return;
    this.clientPopupBusy = true;
    try {
      const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify({ id: this.clientPopup.id, email: this.clientPopup.email }), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('Request failed');
      this.clientPopupNotice('Success', true);
      this.showActionPopup('Success', 'Done', true);
    } catch (e: any) {
      this.clientPopupNotice('Failed', false);
      this.showActionPopup('Failed', 'Error', false);
    } finally {
      this.clientPopupBusy = false;
    }
  }\n"""

text = re.sub(pattern, new_func, text, flags=re.DOTALL)

with open('frontend/src/app/dashboard/dashboard.component.ts', 'w') as f:
    f.write(text)
