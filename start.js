// A simple script to start Next.js with increased memory limits
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Calculate memory limit based on available system memory
// Use 75% of available memory or 4GB, whichever is lower
const availableMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
const memoryLimitMB = Math.min(availableMemoryMB * 0.75, 4096);

console.log(`Starting Next.js with ${Math.floor(memoryLimitMB)}MB memory limit`);

// Set Node.js options for increased memory
const nodeOptions = [
  `--max-old-space-size=${Math.floor(memoryLimitMB)}`,
  '--max-semi-space-size=16'
];

// Set memory options as environment variable
process.env.NODE_OPTIONS = nodeOptions.join(' ');

// For development, use 'dev' instead of 'start'
const isDev = process.argv.includes('--dev');
const nextCommand = isDev ? 'dev' : 'start';

// Find the correct path to Next.js binary on Windows
let nextBin;
const possiblePaths = [
  path.join(process.cwd(), 'node_modules', '.bin', 'next'),
  path.join(process.cwd(), 'node_modules', '.bin', 'next.cmd'),
  'next',
  'next.cmd'
];

for (const binPath of possiblePaths) {
  try {
    if (binPath === 'next' || binPath === 'next.cmd') {
      // Skip explicit check for system-wide binaries
      nextBin = binPath;
      break;
    } else if (fs.existsSync(binPath)) {
      nextBin = binPath;
      break;
    }
  } catch (e) {
    // Continue to next path
  }
}

if (!nextBin) {
  console.error('Could not find Next.js binary. Please ensure Next.js is installed.');
  process.exit(1);
}

// On Windows, we'll use the command directly rather than through npx
console.log(`Using Next.js binary: ${nextBin}`);
console.log(`Running command: ${nextBin} ${nextCommand}`);

// Run Next.js with the configured environment
const nextProcess = spawn(nextBin, [nextCommand], {
  stdio: 'inherit',
  env: process.env,
  shell: true // Use shell on Windows
});

// Handle process signals
nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

nextProcess.on('error', (err) => {
  console.error(`Error executing Next.js: ${err}`);
  process.exit(1);
});

// Forward signals to the child process
process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
}); 