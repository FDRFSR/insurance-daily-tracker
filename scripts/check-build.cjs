#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying standalone build cleanliness...');

const projectRoot = path.resolve(__dirname, '..');
const standaloneFile = path.join(projectRoot, 'server', 'standalone-complete.ts');

if (fs.existsSync(standaloneFile)) {
  const content = fs.readFileSync(standaloneFile, 'utf8');
  
  console.log('📄 Analyzing standalone-complete.ts...');
  
  // Check for problematic imports
  const problematicImports = [
    'wouter',
    'react',
    'react-dom', 
    '@radix-ui',
    'lucide-react',
    '@tanstack',
    'recharts',
    'd3-',
    'vite',
    '@replit'
  ];
  
  let foundProblems = false;
  
  for (const problematic of problematicImports) {
    if (content.includes(`from "${problematic}`) || content.includes(`from '${problematic}`)) {
      console.log(`❌ Found problematic import: ${problematic}`);
      foundProblems = true;
    }
  }
  
  // Check imports
  const importLines = content.split('\n').filter(line => 
    line.trim().startsWith('import ') && 
    !line.includes('from "fs"') && 
    !line.includes('from "path"') &&
    !line.includes('from "http"')
  );
  
  console.log('📦 Found imports:');
  importLines.forEach(line => {
    console.log(`  ${line.trim()}`);
  });
  
  if (!foundProblems) {
    console.log('✅ No problematic frontend dependencies found');
  } else {
    console.log('⚠️ Found frontend dependencies in backend file!');
  }
  
} else {
  console.log('❌ standalone-complete.ts not found');
}

// Check if build output exists and analyze it
const buildOutput = path.join(projectRoot, 'dist-pkg', 'standalone-complete.js');
if (fs.existsSync(buildOutput)) {
  const stats = fs.statSync(buildOutput);
  console.log(`📊 Build output size: ${Math.round(stats.size / 1024)}KB`);
  
  const content = fs.readFileSync(buildOutput, 'utf8');
  
  // Check for problematic code in output
  const problematicStrings = ['wouter', 'd3-array', 'react', '@radix-ui'];
  let foundInOutput = false;
  
  for (const prob of problematicStrings) {
    if (content.includes(prob)) {
      console.log(`⚠️ Found '${prob}' in build output`);
      foundInOutput = true;
    }
  }
  
  if (!foundInOutput) {
    console.log('✅ Build output looks clean');
  }
} else {
  console.log('⚠️ Build output not found, run npm run build:pkg first');
}