#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Building InsuraTask for pkg (CommonJS)...');

const projectRoot = path.resolve(__dirname, '..');

// 1. Build frontend (usa la config standard)
console.log('📦 Building frontend...');
try {
  execSync('vite build', { 
    cwd: projectRoot, 
    stdio: 'inherit' 
  });
  console.log('✅ Frontend build completed');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// 2. Ensure dist-pkg directory exists
const distPkgDir = path.join(projectRoot, 'dist-pkg');
if (!fs.existsSync(distPkgDir)) {
  fs.mkdirSync(distPkgDir, { recursive: true });
}

// 3. Build backend per CommonJS con esbuild
console.log('🔧 Building backend for CommonJS...');
try {
  execSync(`esbuild server/standalone-complete.ts \\
    --platform=node \\
    --target=node18 \\
    --bundle \\
    --format=cjs \\
    --outdir=dist-pkg \\
    --define:__dirname='"__dirname"' \\
    --external:wouter \\
    --external:wouter/* \\
    --external:d3-* \\
    --external:@isaacs/* \\
    --external:recharts \\
    --external:recharts/* \\
    --external:react \\
    --external:react-dom \\
    --external:react/* \\
    --external:@radix-ui/* \\
    --external:lucide-react \\
    --external:@tanstack/* \\
    --external:vite \\
    --external:@replit/* \\
    --external:tailwind* \\
    --external:postcss \\
    --external:autoprefixer \\
    --packages=external \\
    --minify`, { 
    cwd: projectRoot, 
    stdio: 'inherit',
    shell: true
  });
  console.log('✅ Backend CommonJS build completed');
} catch (error) {
  console.error('❌ Backend build failed:', error.message);
  process.exit(1);
}

// 4. Copy public assets to dist-pkg for standalone builds
const publicSrc = path.join(projectRoot, 'dist', 'public');
const publicDest = path.join(projectRoot, 'dist-pkg', 'public');

if (fs.existsSync(publicSrc)) {
  console.log('📁 Copying public assets...');
  
  // Simple recursive copy function
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  try {
    copyRecursive(publicSrc, publicDest);
    console.log('✅ Public assets copied successfully');
  } catch (error) {
    console.error('⚠️ Warning: Failed to copy public assets:', error.message);
  }
} else {
  console.warn('⚠️ Warning: Public assets not found at', publicSrc);
}

console.log('🎉 Build completed successfully!');
console.log('📂 Output directory: dist-pkg/');

// 5. Verify output
const indexFile = path.join(distPkgDir, 'standalone-complete.js');
if (fs.existsSync(indexFile)) {
  const stats = fs.statSync(indexFile);
  console.log(`📄 Main file: standalone-complete.js (${Math.round(stats.size / 1024)}KB)`);
} else {
  console.error('❌ Warning: Main file not found at', indexFile);
}