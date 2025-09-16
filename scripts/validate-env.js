#!/usr/bin/env node

/**
 * Build-time Environment Validation Script
 * 
 * This script validates environment variables during the build/deployment process
 * to catch configuration errors early, before the application starts.
 * 
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate:env
 * 
 * Exit codes:
 *   0 - Validation successful
 *   1 - Validation failed (missing required variables)
 *   2 - Validation failed (invalid format)
 */

const { validateEnvironment, ConfigurationError } = require('../utils/validateEnvironment');

// Load .env file in development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    require('dotenv').config();
    console.log('📄 Loaded .env file for local development\n');
  } catch (error) {
    console.warn('⚠️  Could not load .env file:', error.message);
  }
}

console.log('🔍 Validating environment variables...\n');

try {
  const results = validateEnvironment();
  
  // Success message
  console.log('✅ Environment validation PASSED!\n');
  console.log('===================================\n');
  
  // Display validated variables (masked for security)
  console.log('Validated Spotify credentials:');
  Object.entries(results.spotify).forEach(([key, value]) => {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✓ ${key}: ${masked}`);
  });
  
  // Display warnings if any
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  // Display optional variables
  console.log('\nOptional variables:');
  Object.entries(results.optional).forEach(([key, value]) => {
    console.log(`  • ${key}: ${value}`);
  });
  
  console.log('\n✨ All required environment variables are properly configured!\n');
  
  // Exit successfully
  process.exit(0);
} catch (error) {
  // Validation failed
  console.error('❌ Environment validation FAILED!\n');
  console.error('===================================\n');
  
  if (error instanceof ConfigurationError) {
    // Display detailed error message
    if (error.details?.errorMessage) {
      console.error(error.details.errorMessage);
    } else {
      console.error(error.message);
      
      if (error.details?.missing) {
        console.error('\nMissing variables:');
        error.details.missing.forEach(({ key, description }) => {
          console.error(`  ✗ ${key}: ${description}`);
        });
      }
    }
    
    // Exit with appropriate code
    if (error.message.includes('format')) {
      process.exit(2); // Invalid format
    } else {
      process.exit(1); // Missing variables
    }
  } else {
    // Unexpected error
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}