const fs = require('fs');
const path = require('path');

function getAllFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  });
  return results;
}

const dash = fs.readFileSync('/app/applet/frontend/src/app/dashboard/dashboard.component.ts', 'utf8');
const iconsObjMatch = dash.match(/export const dashboardIcons = \{([\s\S]*?)\};/);
const providedKeys = iconsObjMatch[1].split(',').map(s => s.trim()).filter(Boolean);
const providedSet = new Set(providedKeys);

function toPascalCase(str) {
  return str.replace(/(\w)([a-z0-9]*)(_|-|\s*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
}

const htmlFiles = getAllFiles('/app/applet/frontend/src/app', '.html');
const allMissing = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /<lucide-icon[^>]+>/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const tag = m[0];
    const nameMatch = tag.match(/name="([^"]+)"/);
    if (nameMatch) {
      const name = nameMatch[1];
      const pascal = toPascalCase(name);
      if (!providedSet.has(pascal)) {
        allMissing.push({ file: path.basename(file), name, pascal });
      }
    }
    const dynMatch = tag.match(/\[name\]="([^"]+)"/);
    if (dynMatch) {
      const expr = dynMatch[1];
      const lits = expr.match(/'([^']+)'/g);
      if (lits) {
        for (const l of lits) {
          const name = l.replace(/'/g, '');
          if (!name.includes(' ') && name.length < 30) {
            const pascal = toPascalCase(name);
            // Ignore non-icon strings like status keywords if needed
            if (pascal.length > 2 && !providedSet.has(pascal)) {
              allMissing.push({ file: path.basename(file), name, pascal });
            }
          }
        }
      }
    }
  }
});

console.log("Potential missing icons across all HTML files:", allMissing);
