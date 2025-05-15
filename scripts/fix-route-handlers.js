#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all dynamic route files that need to be fixed
const findDynamicRouteFiles = () => {
  const routeFiles = [];
  const apiDir = 'app/api';
  
  function findInDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item.startsWith('[')) {
          const routeFile = path.join(fullPath, 'route.ts');
          if (fs.existsSync(routeFile)) {
            routeFiles.push(routeFile);
          }
        }
        findInDir(fullPath);
      }
    }
  }
  
  findInDir(apiDir);
  return routeFiles;
};

// List of route files that need to be fixed
const routeFiles = findDynamicRouteFiles();

// Regular expressions for pattern matching
const paramPatternBracket = /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string[\[\]]*\s*(?:,\s*[a-zA-Z0-9_]+\s*:\s*string[\[\]]*\s*)*\}\s*\}/g;
const paramPatternNamed = /(?:context|{\s*params\s*}):\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string[\[\]]*\s*(?:,\s*[a-zA-Z0-9_]+\s*:\s*string[\[\]]*\s*)*\}\s*\}/g;
const paramAccessPattern = /const\s*\{\s*([a-zA-Z0-9_]+(?:\s*,\s*[a-zA-Z0-9_]+)*)\s*\}\s*=\s*(?:await\s*)?params/g;
const idAccessPattern = /const\s*\{\s*([a-zA-Z0-9_]+)\s*\}\s*=\s*(?:await\s*)?(?:params|context\.params)/g;
const directParamsAccessPattern = /const\s+([a-zA-Z0-9_]+)\s*=\s*(?:params|context\.params)\.([a-zA-Z0-9_]+)/g;

// Count of files processed and modified
let processedCount = 0;
let modifiedCount = 0;

console.log('Starting to fix Next.js 15 route handlers...');
console.log(`Found ${routeFiles.length} dynamic route files to process.`);

for (const file of routeFiles) {
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

    // Replace param type patterns
    content = content.replace(paramPatternBracket, (match, paramName) => {
      modified = true;
      return `{ params }: { params: Promise<{ ${paramName}: string }> }`;
    });

    content = content.replace(paramPatternNamed, (match, paramName) => {
      modified = true;
      return `context: { params: Promise<{ ${paramName}: string }> }`;
    });

    // Replace direct params access pattern (e.g., const id = params.id)
    content = content.replace(directParamsAccessPattern, (match, varName, propName) => {
      modified = true;
      if (content.includes('context.params')) {
        return `const ${varName} = await context.params.then(p => p.${propName})`;
      } else {
        return `const ${varName} = await params.then(p => p.${propName})`;
      }
    });
    
    // Replace param access patterns
    if (content.includes('params}') || content.includes('context.params')) {
      content = content.replace(paramAccessPattern, (match, paramNames) => {
        modified = true;
        return `const { ${paramNames} } = await params`;
      });

      content = content.replace(idAccessPattern, (match, idName) => {
        modified = true;
        if (content.includes('context.params')) {
          return `const ${idName} = await context.params.then(p => p.${idName})`;
        } else {
          return `const ${idName} = await params.then(p => p.${idName})`;
        }
      });
    }

    // Write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
      modifiedCount++;
      modified = true;
    } else {
      console.log(`No changes needed for: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log(`\nCompleted! Processed ${processedCount} files, modified ${modifiedCount} files.`); 