const fs = require('fs');
const dash = fs.readFileSync('/app/applet/frontend/src/app/dashboard/dashboard.component.ts', 'utf8');
const schoolHtml = fs.readFileSync('/app/applet/frontend/src/app/dashboard/school-dashboard/school-dashboard.component.html', 'utf8');

function toPascalCase(str) {
  return str.replace(/(\w)([a-z0-9]*)(_|-|\s*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
}

const regex = /<lucide-icon[^>]+>/g;
let m;
const tags = [];
while ((m = regex.exec(schoolHtml)) !== null) {
  tags.push(m[0]);
}

const iconExpressions = [];
for (const tag of tags) {
  const dyn = tag.match(/\[name\]="([^"]+)"/);
  if (dyn) {
    iconExpressions.push(dyn[1]);
  }
  const stat = tag.match(/name="([^"]+)"/);
  if (stat) {
    iconExpressions.push(`"${stat[1]}"`);
  }
}

const iconNames = new Set();
for (const expr of iconExpressions) {
  const lits = expr.match(/'([^']+)'/g);
  if (lits) {
    for (const l of lits) iconNames.add(l.replace(/'/g, ''));
  }
  const doubleLits = expr.match(/"([^"]+)"/g);
  if (doubleLits) {
    for (const l of doubleLits) iconNames.add(l.replace(/"/g, ''));
  }
}

const conditionWords = new Set(["success", "portals", "settings", "overview", "students", "teachers", "admissions", "attendance", "finance", "exams", "Active"]);
const iconsToCheck = [...iconNames].filter(i => !conditionWords.has(i));

const iconsObjMatch = dash.match(/export const dashboardIcons = \{([\s\S]*?)\};/);
const providedKeys = iconsObjMatch[1].split(',').map(s => s.trim()).filter(Boolean);
const providedSet = new Set(providedKeys);

console.log("Icons found in School template:", iconsToCheck);
const missing = [];
for (const ic of iconsToCheck) {
  const pascal = toPascalCase(ic);
  if (!providedSet.has(pascal)) {
    missing.push({ name: ic, pascal });
  }
}
console.log("Missing from dashboardIcons:", missing);
