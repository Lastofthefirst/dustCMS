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
    console.log(`✓ Super admin: ${admin.email}`);
    console.log('\nRun without "setup" argument to start the server.');
    process.exit(0);
  }

  console.log('Setting up dustCMS...\n');

  // Prompt for email
  const email = prompt('Super admin email:');
  if (!email) {
    console.error('Email is required');
    process.exit(1);
  }

  // Prompt for password
  const password = prompt('Super admin password (min 8 chars):', { echo: false });
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  // Create super admin
  const passwordHash = await hashPassword(password);
  createSuperAdmin(email, passwordHash);

  console.log('\n✓ Setup completed successfully!');
  console.log(`✓ Super admin created: ${email}`);
  console.log(`\nYou can now start the server with: bun run src/main.ts`);
  console.log(`Or build the binary with: ./build.sh`);
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
