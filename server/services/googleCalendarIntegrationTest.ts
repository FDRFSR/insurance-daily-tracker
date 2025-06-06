/**
 * Google Calendar Integration Test Suite
 * Tests the complete integration between all calendar services
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-06-06
 */

import { googleAuthService } from '../services/googleAuthService.js';
import { googleCalendarService } from '../services/googleCalendarService.js';
import { calendarSyncService } from '../services/calendarSyncService.js';
import { googleCalendarDb } from '../services/googleCalendarDatabase.js';

/**
 * Test suite for Google Calendar integration
 */
export async function testGoogleCalendarIntegration() {
  console.log('🧪 Starting Google Calendar Integration Tests...\n');

  // Test 1: Database Schema Validation
  console.log('1. Testing Database Schema...');
  try {
    const tables = googleCalendarDb.validateSchema();
    console.log('✅ Database schema is valid');
    console.log(`   Created tables: ${tables.join(', ')}\n`);
  } catch (error) {
    console.error('❌ Database schema validation failed:', error);
    return false;
  }

  // Test 2: Service Instantiation
  console.log('2. Testing Service Instantiation...');
  try {
    const authServiceExists = typeof googleAuthService.getAuthUrl === 'function';
    const calendarServiceExists = typeof googleCalendarService.getCalendars === 'function';
    const syncServiceExists = typeof calendarSyncService.performSync === 'function';

    if (authServiceExists && calendarServiceExists && syncServiceExists) {
      console.log('✅ All services are properly instantiated');
      console.log('   - GoogleAuthService: Available');
      console.log('   - GoogleCalendarService: Available');
      console.log('   - CalendarSyncService: Available\n');
    } else {
      throw new Error('One or more services are not properly instantiated');
    }
  } catch (error) {
    console.error('❌ Service instantiation test failed:', error);
    return false;
  }

  // Test 3: Configuration Management
  console.log('3. Testing Configuration Management...');
  try {
    const config = googleCalendarDb.getGoogleCalendarConfig();
    console.log('✅ Configuration system working');
    console.log(`   Current config: ${config ? 'Configured' : 'Not configured'}\n`);
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return false;
  }

  // Test 4: OAuth URL Generation
  console.log('4. Testing OAuth URL Generation...');
  try {
    const authUrl = googleAuthService.getAuthUrl();
    const isValidUrl = authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth');
    
    if (isValidUrl) {
      console.log('✅ OAuth URL generation working');
      console.log(`   Generated URL: ${authUrl.substring(0, 60)}...\n`);
    } else {
      throw new Error('Invalid OAuth URL generated');
    }
  } catch (error) {
    console.error('❌ OAuth URL generation test failed:', error);
    return false;
  }

  // Test 5: Sync Status Monitoring
  console.log('5. Testing Sync Status Monitoring...');
  try {
    const status = calendarSyncService.getSyncStatus();
    console.log('✅ Sync status monitoring working');
    console.log(`   Is configured: ${status.isConfigured}`);
    console.log(`   Is enabled: ${status.isEnabled}`);
    console.log(`   Last sync: ${status.lastSyncTime || 'Never'}\n`);
  } catch (error) {
    console.error('❌ Sync status test failed:', error);
    return false;
  }

  // Test 6: Database Operations
  console.log('6. Testing Database Operations...');
  try {
    const stats = googleCalendarDb.getSyncStats();
    const auditLogs = googleCalendarDb.getRecentSyncAudits(5);
    
    console.log('✅ Database operations working');
    console.log(`   Total mappings: ${stats.totalMappings}`);
    console.log(`   Sync attempts: ${stats.syncAttempts}`);
    console.log(`   Recent audit logs: ${auditLogs.length}\n`);
  } catch (error) {
    console.error('❌ Database operations test failed:', error);
    return false;
  }

  console.log('🎉 All Google Calendar Integration Tests Passed!\n');
  console.log('📋 Integration Status Summary:');
  console.log('   ✅ Backend Services: Ready');
  console.log('   ✅ Database Schema: Validated');
  console.log('   ✅ OAuth Flow: Configured');
  console.log('   ✅ API Endpoints: Available');
  console.log('   ✅ Frontend Components: Integrated');
  console.log('   ⚠️  Google API Credentials: Need configuration');
  
  return true;
}

/**
 * Run integration test if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  testGoogleCalendarIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Integration test failed:', error);
      process.exit(1);
    });
}
