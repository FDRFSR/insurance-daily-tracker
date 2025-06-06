// Debug import script
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing cronService import...');
console.log('Current directory:', __dirname);

try {
  // Try to import the cronService directly
  const cronPath = join(__dirname, 'server/services/cronService.js');
  console.log('Attempting to import from:', cronPath);
  
  const cronModule = await import('./server/services/cronService.js');
  console.log('Import successful!');
  console.log('Available exports:', Object.keys(cronModule));
  console.log('cronService:', cronModule.cronService);
} catch (error) {
  console.error('Import failed:', error);
  console.error('Error details:', error.message);
  console.error('Error stack:', error.stack);
}
