#!/usr/bin/env node

/**
 * Integrate Auth Guardian module to a NestJS project
 * Usage: npx nestjs-auth-guardian-integrate
 *
 * This command:
 * 1. Copies auth, jwt, mfa, decorators, guards, config, utils, interfaces directories to /src
 * 2. Installs all related packages
 * 3. Creates .env.example file
 */

const { integrate } = require('./integrate-core');

const targetProjectPath = process.cwd();

// Create logger interface for console output
const logger = {
  info: (message) => console.log(message),
  warn: (message) => console.log(message),
  error: (message) => console.error(message),
};

// Run integration
const result = integrate({
  projectPath: targetProjectPath,
  baseDir: __dirname,
  logger,
});

if (!result.success) {
  console.error(`❌ Error: ${result.error}`);
  if (result.hint) {
    console.log(`💡 ${result.hint}`);
  }
  process.exit(1);
}
