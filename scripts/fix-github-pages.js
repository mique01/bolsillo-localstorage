const fs = require('fs');
const path = require('path');

// Configuration
const repoName = 'bolsilloapp-localstorage';
const outDir = 'out';

// Ensure the output directory exists
if (!fs.existsSync(outDir)) {
  console.log(`Output directory ${outDir} does not exist. Creating it...`);
  fs.mkdirSync(outDir, { recursive: true });
} else {
  console.log(`Output directory ${outDir} exists.`);
}

// Copy files to the output directory
const filesToCopy = ['index.html', '404.html'];
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    const destination = path.join(outDir, file);
    fs.copyFileSync(file, destination);
    console.log(`Copied ${file} to ${destination}`);
  } else {
    console.warn(`Warning: ${file} does not exist and cannot be copied.`);
  }
});

// Create a .nojekyll file to bypass Jekyll processing on GitHub Pages
const nojekyllPath = path.join(outDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log(`Created ${nojekyllPath} file`);

// Create a CNAME file if needed (for custom domain)
// Uncomment and modify the following lines if you have a custom domain
/*
const cnamePath = path.join(outDir, 'CNAME');
fs.writeFileSync(cnamePath, 'your-custom-domain.com');
console.log(`Created ${cnamePath} file with your custom domain`);
*/

// Create a GitHub Pages specific _config.yml file
const configYmlPath = path.join(outDir, '_config.yml');
const configYmlContent = `
# GitHub Pages configuration
title: Bolsillo App
description: Aplicación de gestión de gastos y finanzas personales
baseurl: /${repoName}
url: https://username.github.io
`;
fs.writeFileSync(configYmlPath, configYmlContent);
console.log(`Created ${configYmlPath} file for GitHub Pages`);

console.log('GitHub Pages preparation completed successfully!'); 