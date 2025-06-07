/**
 * Integration Test Runner
 * Runs the Google Calendar integration test suite
 */

import { testGoogleCalendarIntegration } from './server/services/googleCalendarIntegrationTest.js';

async function runTests() {
  try {
    console.log('🚀 Starting Google Calendar Integration Test Suite...\n');
    
    const success = await testGoogleCalendarIntegration();
    
    if (success) {
      console.log('\n✅ All integration tests passed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some integration tests failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Integration test runner failed:', error);
    process.exit(1);
  }
}

runTests();
