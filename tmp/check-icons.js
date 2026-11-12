const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = walk('frontend/src');
const iconNames = new Map();
const nameRegex = /lucide-icon[^>]*\[?name\]?=["'\s]*['"]?([a-zA-Z0-9-]+)['"]?/g;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = nameRegex.exec(content)) !== null) {
    let name = match[1];
    if (name) {
      if (!iconNames.has(name)) iconNames.set(name, []);
      iconNames.get(name).push(file);
    }
  }
});

const dashTs = fs.readFileSync('frontend/src/app/dashboard/dashboard.component.ts', 'utf8');
const dashIconsBlock = dashTs.slice(dashTs.indexOf('export const dashboardIcons'));

console.log('Unique icons used in HTML:', Array.from(iconNames.keys()));

const missing = [];
for (const icon of iconNames.keys()) {
  const pascal = icon.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  if (!dashTs.includes(pascal) && !dashIconsBlock.includes(icon) && !dashIconsBlock.includes(pascal)) {
    missing.push({ icon, pascal, files: iconNames.get(icon) });
  }
}

console.log('Potentially missing icons in dashboard.component.ts:', JSON.stringify(missing, null, 2));
