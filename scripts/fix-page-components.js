#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all dynamic page components that need to be fixed
const findDynamicPageFiles = () => {
  const pageFiles = [];
  const appDir = 'app';
  
  function findInDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item.startsWith('[')) {
          const pageFile = path.join(fullPath, 'page.tsx');
          if (fs.existsSync(pageFile)) {
            pageFiles.push(pageFile);
          }
        }
        findInDir(fullPath);
      }
    }
  }
  
  findInDir(appDir);
  return pageFiles;
};

// List of page files that need to be fixed
const pageFiles = findDynamicPageFiles();

// Regular expressions for pattern matching
const paramsTypePattern = /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string(\[\])?\s*\}\s*\}/g;
const simpleParamsTypePattern = /params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string(\[\])?\s*\}/g;
const paramAccessPattern = /React\.use\(Promise\.resolve\(params\)\)\.([a-zA-Z0-9_]+)/g;

// Count of files processed and modified
let processedCount = 0;
let modifiedCount = 0;

console.log('Starting to fix Next.js 15 page components...');
console.log(`Found ${pageFiles.length} dynamic page files to process.`);

for (const file of pageFiles) {
  try {
    // Check if file exists
    if (!fs.existsSync(file)) {
      console.log(`File not found: ${file}, skipping...`);
      continue;
    }

    processedCount++;
    
    // Read the file content
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;

    // Replace params type patterns
    content = content.replace(paramsTypePattern, (match, paramName, arrayBrackets = '') => {
      modified = true;
      return `{ params }: { params: Promise<{ ${paramName}: string${arrayBrackets} }> }`;
    });

    content = content.replace(simpleParamsTypePattern, (match, paramName, arrayBrackets = '') => {
      modified = true;
      return `params: Promise<{ ${paramName}: string${arrayBrackets} }>`;
    });

    // Replace React.use(Promise.resolve(params)).id with React.use(params).id
    content = content.replace(paramAccessPattern, (match, propName) => {
      modified = true;
      return `React.use(params).${propName}`;
    });

    // Write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
      modifiedCount++;
    } else {
      console.log(`No changes needed for: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log(`\nCompleted! Processed ${processedCount} files, modified ${modifiedCount} files.`); 