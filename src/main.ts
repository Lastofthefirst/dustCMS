#!/usr/bin/env bun

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from './config';
import { startServer } from './server';
import { getSuperAdmin, createSuperAdmin } from './db/system';
import { hashPassword } from './services/auth';

async function ensureDataDirectory() {
  if (!existsSync(config.dataDir)) {
    mkdirSync(config.dataDir, { recursive: true });
  }

  const tenantsDir = join(config.dataDir, 'tenants');
  if (!existsSync(tenantsDir)) {
    mkdirSync(tenantsDir, { recursive: true });
  }
}

async function runSetupWizard() {
  console.log(`
╔═══════════════════════════════════════╗
║       dustCMS Setup Wizard            ║
╚═══════════════════════════════════════╝
`);

  const admin = getSuperAdmin();
  if (admin) {
    console.log('✓ Setup already completed!');
    console.log(`✓ Super admin: ${admin.username}`);
    console.log(`✓ Base domain: ${config.baseDomain}`);
    console.log('\nRun without "setup" argument to start the server.');
    process.exit(0);
  }

  console.log('Setting up dustCMS for production...\n');

  // Prompt for base domain
  console.log('Base domain (e.g., cms.example.com):');
  console.log('Tenants will be accessed at: tenant-slug.<domain>');
  const baseDomain = prompt('Domain:', { default: config.baseDomain });
  if (!baseDomain) {
    console.error('❌ Base domain is required');
    process.exit(1);
  }
  config.baseDomain = baseDomain;

  console.log('');

  // Prompt for username
  const username = prompt('Super admin username:');
  if (!username) {
    console.error('❌ Username is required');
    process.exit(1);
  }

  // Prompt for password
  const password = prompt('Super admin password (min 8 chars):', { echo: false });
  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('');

  // Create super admin
  const passwordHash = await hashPassword(password);
  createSuperAdmin(username, passwordHash);

  console.log('✓ Setup completed successfully!');
  console.log(`✓ Super admin: ${username}`);
  console.log(`✓ Base domain: ${baseDomain}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Start server: bun run src/main.ts`);
  console.log(`   2. Login at: http://localhost:${config.port}/admin/login`);
  console.log(`   3. Create your first tenant`);
  console.log(`\n💡 For production: ./build.sh to create standalone binary`);
}

async function main() {
  // Ensure data directory exists
  await ensureDataDirectory();

  // Check if running setup command
  const args = process.argv.slice(2);
  if (args.includes('setup')) {
    await runSetupWizard();
    return;
  }

  // Check if setup has been completed
  const admin = getSuperAdmin();
  if (!admin) {
    console.log(`
╔═══════════════════════════════════════╗
║   dustCMS - Setup Required            ║
╚═══════════════════════════════════════╝

⚠️  You need to run setup first!

Run:  bun run src/main.ts setup

This will configure your admin account and base domain.
`);
    process.exit(1);
  }

  // Start the server
  await startServer();
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run
main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
