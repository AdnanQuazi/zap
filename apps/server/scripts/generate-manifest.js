// server/scripts/generate-manifest.js
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.BASE_URL;

if (!baseUrl) {
  console.error('Error: BASE_URL environment variable not set.');
  process.exit(1);
}

const templatePath = path.join(__dirname, '..', 'slack', 'manifest.template.json');
const outputPath = path.join(__dirname, '..', 'slack', 'manifest.json');

let manifest = fs.readFileSync(templatePath, 'utf8');
manifest = manifest.replace(/\$\{BASE_URL\}/g, baseUrl);

fs.writeFileSync(outputPath, manifest, 'utf8');
console.log('✅ manifest.json generated successfully.');
