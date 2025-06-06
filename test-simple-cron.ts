// Simple test of cronService exports
import cron from 'node-cron';

export const testExport = 'test';

export const cronService = {
  test: () => console.log('Test method')
};

console.log('CronService module loaded successfully');
