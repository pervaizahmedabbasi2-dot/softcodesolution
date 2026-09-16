import re

with open('frontend/src/app/register/register.component.ts', 'r') as f:
    content = f.read()

fallback_code = """
    } catch (error: any) {
      // Fallback for AI Studio preview without backend
      this.businessTypes = [
        { id: '1', name: 'Retail / E-commerce', module_category: 'RETAIL', pricing_weight: 1, sort_order: 1 },
        { id: '2', name: 'Restaurant / Cafe', module_category: 'FNB', pricing_weight: 1, sort_order: 2 },
        { id: '3', name: 'Healthcare / Clinic', module_category: 'HEALTH', pricing_weight: 2, sort_order: 3 },
        { id: '4', name: 'Education / School', module_category: 'EDU', pricing_weight: 1.5, sort_order: 4 },
        { id: '5', name: 'Real Estate', module_category: 'REALESTATE', pricing_weight: 2, sort_order: 5 },
        { id: '6', name: 'IT Services / Agency', module_category: 'AGENCY', pricing_weight: 1, sort_order: 6 },
        { id: '7', name: 'Manufacturing', module_category: 'MFG', pricing_weight: 2.5, sort_order: 7 },
        { id: '8', name: 'Other', module_category: 'OTHER', pricing_weight: 1, sort_order: 8 }
      ];
      this.businessTypesError = '';
    } finally {
"""

content = content.replace("    } catch (error: any) {\n      this.businessTypes = [];\n      this.businessTypesError = String(error?.message || 'Business types could not load. Refresh the page.');\n    } finally {", fallback_code)

with open('frontend/src/app/register/register.component.ts', 'w') as f:
    f.write(content)
