import fs from 'fs';

const content = fs.readFileSync('frontend/src/features/admin/AdminDashboard.jsx', 'utf8');

// Extract the section for gameSubView === 'images'
const start = content.indexOf("{gameSubView === 'images' && (");
const end = content.indexOf("{/* VIEW 3:", start + 30);
const imgSection = content.slice(start, start + 7000);

// Check all onClick / onChange handlers in imgSection
const handlers = [...imgSection.matchAll(/onClick=\{([a-zA-Z0-9_]+)\}/g)].map(m => m[1]);
const calls = [...imgSection.matchAll(/onClick=\{\(\)\s*=>\s*([a-zA-Z0-9_]+)\(/g)].map(m => m[1]);
console.log('Direct handlers:', handlers);
console.log('Arrow function calls:', calls);

for (const h of [...handlers, ...calls]) {
  const isFound = content.includes(`function ${h}`) || content.includes(`const ${h}`) || content.includes(`let ${h}`);
  console.log(`Handler ${h}: ${isFound ? 'OK' : 'MISSING'}`);
}

