#!/usr/bin/env node

// Production startup script with better error handling
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

console.log(`🚀 Starting Altar Server Check-In System`);
console.log(`📦 Node.js version: ${nodeVersion}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('Please set these variables and restart the application.');
  process.exit(1);
}

// Check if we're in production and dist exists
if (process.env.NODE_ENV === 'production') {
  try {
    const distIndexPath = join(__dirname, '../dist/index.js');
    console.log(`📂 Loading production build from: ${distIndexPath}`);
    await import(distIndexPath);
  } catch (error) {
    console.error('❌ Failed to load production build:', error.message);
    console.error('Make sure you ran the build process first.');
    process.exit(1);
  }
} else {
  // Development mode
  try {
    console.log('🔧 Starting in development mode...');
    await import('./index.ts');
  } catch (error) {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  }
}