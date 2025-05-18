#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const config = {
  remoteHost: '167.235.137.52',
  remoteUser: 'root',
  remotePassword: 'TpFdwT2XKZ7UuF1jF8',
  remotePath: '/var/www/greenroasteries',
  excludeFiles: [
    'node_modules',
    '.git',
    '.next/cache',
    '.env.local',
    'scripts/deploy.js'
  ]
};

// Logger
const log = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  step: (message) => console.log(`${colors.cyan}[STEP]${colors.reset} ${message}`)
};

// Run command and return output
function runCommand(command, silent = false) {
  try {
    if (!silent) log.info(`Running: ${command}`);
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    log.error(`Command failed: ${command}`);
    log.error(error.message);
    throw error;
  }
}

// Fix ESLint errors automatically (only unused variables and React hooks)
function fixEslintErrors() {
  log.step('Fixing ESLint errors automatically...');
  
  // First, let's try the built-in ESLint fix functionality
  try {
    runCommand('npm run lint -- --fix', true);
    log.success('Applied automatic ESLint fixes');
  } catch (error) {
    log.warning('Could not automatically fix all ESLint errors');
    log.info('Continuing with deployment anyway...');
  }
}

// Create SSH configuration for auto-deployment
function setupSSHConfig() {
  log.step('Setting up SSH config for deployment...');
  
  const sshDir = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh');
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { recursive: true });
  }
  
  // Create SSH key if it doesn't exist
  const keyPath = path.join(sshDir, 'id_rsa_greenroasteries');
  if (!fs.existsSync(keyPath)) {
    log.info('SSH key not found, generating new one...');
    runCommand(`ssh-keygen -t rsa -b 4096 -C "greenroasteries-deploy" -f "${keyPath}" -N ""`, true);
    
    // Copy the public key to the server
    log.info('Copying SSH key to server...');
    const pubKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();
    
    // We need to use sshpass for first-time password authentication
    try {
      runCommand(`sshpass -p "${config.remotePassword}" ssh-copy-id -i "${keyPath}.pub" ${config.remoteUser}@${config.remoteHost}`, true);
    } catch (error) {
      log.warning('Could not automatically copy SSH key to server');
      log.info('Please manually add this key to your server\'s authorized_keys:');
      console.log(pubKey);
      process.exit(1);
    }
  }
  
  return keyPath;
}

// Build the application
function buildApp() {
  log.step('Building the application...');
  runCommand('npm run build');
  log.success('Build completed successfully');
}

// Deploy to server
function deployToServer(sshKeyPath) {
  log.step('Deploying to server...');
  
  // Build exclude arguments
  const excludeArgs = config.excludeFiles.map(file => `--exclude='${file}'`).join(' ');
  
  // Use rsync to deploy files
  const rsyncCommand = `rsync -avz --delete ${excludeArgs} -e "ssh -i ${sshKeyPath}" ./ ${config.remoteUser}@${config.remoteHost}:${config.remotePath}`;
  runCommand(rsyncCommand);
  
  // Restart Docker containers on the server
  log.step('Restarting Docker containers on server...');
  runCommand(`ssh -i ${sshKeyPath} ${config.remoteUser}@${config.remoteHost} "cd ${config.remotePath} && docker-compose down && docker-compose up -d"`);
  
  log.success('Deployment completed successfully!');
}

// Set up a git hook for automatic deployment
function setupGitHook() {
  log.step('Setting up Git hook for automatic deployment...');
  
  const hooksDir = path.join(process.cwd(), '.git', 'hooks');
  const postPushHook = path.join(hooksDir, 'post-push');
  
  const hookContent = `#!/bin/sh
echo "Running automatic deployment after Git push..."
node ${path.join(process.cwd(), 'scripts', 'deploy.js')}
`;

  fs.writeFileSync(postPushHook, hookContent);
  fs.chmodSync(postPushHook, '755');
  
  log.success('Git hook installed successfully');
}

// Main function
async function main() {
  try {
    log.info('Starting deployment process...');
    
    // Fix ESLint errors
    fixEslintErrors();
    
    // Set up SSH config
    const sshKeyPath = setupSSHConfig();
    
    // Build the application
    buildApp();
    
    // Deploy to server
    deployToServer(sshKeyPath);
    
    // Set up Git hook
    setupGitHook();
    
    log.success('Deployment process completed successfully!');
  } catch (error) {
    log.error('Deployment failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main(); 