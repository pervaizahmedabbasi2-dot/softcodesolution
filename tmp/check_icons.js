import fs from 'fs';
import path from 'path';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.html') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles('frontend/src/app');
const iconNames = new Set();
const nameRegex = /\[name\]="([^"]+)"|name="([^"]+)"/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = nameRegex.exec(content)) !== null) {
    const val = match[1] || match[2];
    if (val && !val.includes('icons.') && !val.includes('getTabIcon') && !val.includes('item.')) {
      const cleanVal = val.replace(/'/g, '').trim();
      if (cleanVal) iconNames.add(cleanVal);
    }
  }
}

console.log('Found icon names:', Array.from(iconNames).sort());
