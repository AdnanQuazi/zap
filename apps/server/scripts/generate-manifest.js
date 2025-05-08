// server/scripts/generate-manifest.js
const fs = require('fs');
const path = require('path');

const baseUrl         = process.env.BASE_URL;
const appName         = process.env.APP_NAME;
const commandPrefix   = process.env.COMMAND_PREFIX;

if (!baseUrl || !appName || !commandPrefix) {
  console.error('Error: BASE_URL, APP_NAME, and COMMAND_PREFIX must all be set.');
  process.exit(1);
}

const templatePath = path.join(__dirname, '..', 'slack', 'manifest.template.json');
const outputPath   = path.join(__dirname, '..', 'slack', 'manifest.json');

let manifest = fs.readFileSync(templatePath, 'utf8');
manifest = manifest
  .replace(/\$\{BASE_URL\}/g, baseUrl)
  .replace(/\$\{APP_NAME\}/g, appName)
  .replace(/\$\{COMMAND_PREFIX\}/g, commandPrefix);

fs.writeFileSync(outputPath, manifest, 'utf8');
console.log(`✅ manifest.json generated: ${outputPath}`);
