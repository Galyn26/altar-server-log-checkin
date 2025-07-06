#!/usr/bin/env node

// Simple build script for Render deployment
import { build } from 'vite';
import { build as esbuildBuild } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildProject() {
  try {
    console.log('📦 Building frontend with Vite...');
    
    // Build frontend
    await build({
      // Vite will use the config from vite.config.ts
      mode: 'production',
    });
    
    console.log('✅ Frontend build complete');
    
    console.log('📦 Building backend with esbuild...');
    
    // Build backend
    await esbuildBuild({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      packages: 'external',
      format: 'esm',
      outdir: 'dist',
      target: 'node18',
      sourcemap: true,
      minify: true,
    });
    
    console.log('✅ Backend build complete');
    console.log('🎉 Build finished successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildProject();