// Test script to debug cronService import
try {
  console.log('Importing cronService...');
  const module = await import('./server/services/cronService.js');
  console.log('Module imported successfully');
  console.log('Available exports:', Object.keys(module));
  console.log('cronService type:', typeof module.cronService);
  console.log('cronService value:', module.cronService);
  
  if (module.cronService) {
    console.log('cronService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(module.cronService)));
  }
} catch (error) {
  console.error('Import failed:', error);
}
