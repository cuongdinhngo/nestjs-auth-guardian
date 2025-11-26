const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Core integration logic for Auth Guardian module
 * This module contains the shared logic used by both:
 * - scripts/integrate.js (npx command)
 * - schematics/integration/index.js (nest generate command)
 */

// Required npm packages
const REQUIRED_PACKAGES = [
  '@nestjs/jwt',
  '@nestjs/passport',
  '@nestjs/typeorm',
  'passport',
  'passport-jwt',
  'speakeasy',
  'qrcode',
  'bcrypt',
  'typeorm',
  'class-validator',
  'class-transformer',
];

const REQUIRED_DEV_PACKAGES = [
  '@types/passport-jwt',
  '@types/speakeasy',
  '@types/qrcode',
  '@types/bcrypt',
];

// Directories to copy
const DIRECTORIES_TO_COPY = [
  'auth',
  'jwt',
  'mfa',
  'decorators',
  'guards',
  'config',
  'utils',
  'interfaces',
];

/**
 * Find source directory
 * @param {string} baseDir - Base directory (usually __dirname of the calling script)
 * @returns {string} Path to source directory
 */
function findSourceDir(baseDir) {
  // Try multiple possible paths to find the source directory
  const possiblePaths = [
    // From scripts directory: ../src
    path.join(baseDir, '../src'),
    // From schematics directory: ../../src
    path.join(baseDir, '../../src'),
  ];

  // Check each possible path
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  // If none of the relative paths work, try package resolution
  try {
    const packagePath = require.resolve('nestjs-auth-guardian/package.json');
    const sourceDir = path.join(path.dirname(packagePath), 'src');
    if (fs.existsSync(sourceDir)) {
      return sourceDir;
    }
  } catch (error) {
    // Package resolution failed, continue to fallback
  }

  // Fallback to the original path (for backward compatibility)
  return path.join(baseDir, '../src');
}

/**
 * Recursively copy directory
 * @param {string} source - Source directory path
 * @param {string} target - Target directory path
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Validate project structure before integration
 * @param {string} projectPath - Path to the target project
 * @param {string} targetSrcDir - Path to src directory
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateProject(projectPath, targetSrcDir) {
  // Check if target project exists
  if (!fs.existsSync(projectPath)) {
    return {
      valid: false,
      error: `Target project path does not exist: ${projectPath}`,
    };
  }

  // Check if package.json exists
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return {
      valid: false,
      error: 'No package.json found. Are you in a NestJS project?',
    };
  }

  // Check if src directory exists
  if (!fs.existsSync(targetSrcDir)) {
    return {
      valid: false,
      error: 'No src directory found. Are you in a NestJS project?',
    };
  }

  return { valid: true };
}

/**
 * Create .env.example file
 * @param {string} projectPath - Path to the target project
 */
function createEnvExample(projectPath) {
  const envExamplePath = path.join(projectPath, '.env.example');
  const envContent = `# JWT Configuration (Required)
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m

# JWT Refresh Tokens (Optional)
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# MFA Configuration (Optional)
MFA_ISSUER=Your App Name
`;

  // Only create if doesn't exist or append if exists
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, envContent);
  } else {
    // Check if JWT_SECRET already exists
    const existingContent = fs.readFileSync(envExamplePath, 'utf8');
    if (!existingContent.includes('JWT_SECRET')) {
      fs.appendFileSync(envExamplePath, '\n' + envContent);
    }
  }
}

/**
 * Install npm packages
 * @param {string} projectPath - Path to the target project
 * @param {object} logger - Logger object with info, warn, error methods
 */
function installPackages(projectPath, logger) {
  logger.info('\n📦 Installing required packages...');

  try {
    // Install regular dependencies
    const packagesCommand = `npm install ${REQUIRED_PACKAGES.join(' ')}`;
    logger.info(`Running: ${packagesCommand}`);
    execSync(packagesCommand, { cwd: projectPath, stdio: 'inherit' });

    // Install dev dependencies
    const devPackagesCommand = `npm install -D ${REQUIRED_DEV_PACKAGES.join(' ')}`;
    logger.info(`Running: ${devPackagesCommand}`);
    execSync(devPackagesCommand, { cwd: projectPath, stdio: 'inherit' });

    logger.info('✅ Packages installed successfully!');
  } catch (error) {
    throw new Error(`Failed to install packages: ${error.message}`);
  }
}

/**
 * Main integration function
 * @param {object} options - Integration options
 * @param {string} options.projectPath - Path to the target project
 * @param {string} options.baseDir - Base directory for finding source files
 * @param {object} options.logger - Logger object with info, warn, error methods
 * @returns {{success: boolean, error?: string, hint?: string}} Integration result
 */
function integrate({ projectPath, baseDir, logger }) {
  try {
    logger.info('🚀 Starting NestJS Auth Guardian integration...\n');

    // Find source directory
    const sourceDir = findSourceDir(baseDir);
    const targetSrcDir = path.join(projectPath, 'src');

    // Validate project
    const validation = validateProject(projectPath, targetSrcDir);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        hint: 'Make sure you are running this command from the root of a NestJS project',
      };
    }

    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      return {
        success: false,
        error: `Source directory not found: ${sourceDir}`,
        hint: 'This might be a package installation issue. Try reinstalling nestjs-auth-guardian',
      };
    }

    // Copy directories
    logger.info('📁 Copying auth guardian files...');
    for (const dir of DIRECTORIES_TO_COPY) {
      const sourceSubDir = path.join(sourceDir, dir);
      const targetSubDir = path.join(targetSrcDir, dir);

      if (fs.existsSync(sourceSubDir)) {
        if (fs.existsSync(targetSubDir)) {
          logger.warn(`⚠️  Directory ${dir} already exists, skipping...`);
        } else {
          copyDirectory(sourceSubDir, targetSubDir);
          logger.info(`✅ Copied ${dir}/`);
        }
      } else {
        logger.warn(`⚠️  Source directory ${dir} not found, skipping...`);
      }
    }

    // Create .env.example
    logger.info('\n📝 Creating .env.example...');
    createEnvExample(projectPath);
    logger.info('✅ .env.example created!');

    // Install packages
    installPackages(projectPath, logger);

    // Success message
    logger.info('\n✨ Integration completed successfully!\n');
    logger.info('📚 Next steps:');
    logger.info('1. Add @MfaEntity() decorator to your User entity');
    logger.info('2. Import AuthGuardianModule.forFeature(User) in your app.module.ts');
    logger.info('3. Set JWT_SECRET in your .env file');
    logger.info('4. Run migrations to add MFA columns to your database');
    logger.info('\n📖 Check the documentation: https://github.com/your-repo/nestjs-auth-guardian\n');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: 'Check the error message above for more details',
    };
  }
}

module.exports = {
  integrate,
  REQUIRED_PACKAGES,
  REQUIRED_DEV_PACKAGES,
  DIRECTORIES_TO_COPY,
};
