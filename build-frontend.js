#!/usr/bin/env node

/**
 * Build script for frontend deployment
 * Replaces API_BASE_URL placeholder in HTML files
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || '';
const PUBLIC_DIR = path.join(__dirname, 'public');

// Files to process
const filesToProcess = ['index.html', 'login.html'];

filesToProcess.forEach(file => {
  const filePath = path.join(PUBLIC_DIR, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace placeholder with actual API URL
    content = content.replace(/%VITE_API_BASE_URL%/g, API_BASE_URL);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Processed ${file}`);
  }
});

console.log(`\n✓ Build complete. API Base URL: ${API_BASE_URL || '(empty - using relative paths)'}`);

