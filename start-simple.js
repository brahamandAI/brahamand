// A simpler script to start Next.js with increased memory limits
const { spawn } = require('child_process');
const os = require('os');

// Calculate memory limit based on available system memory
// Use 75% of available memory or 4GB, whichever is lower
const availableMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
const memoryLimitMB = Math.min(availableMemoryMB * 0.75, 4096);

console.log(`Starting Next.js with ${Math.floor(memoryLimitMB)}MB memory limit`);

// Set environment variable for increased memory
process.env.NODE_OPTIONS = `--max-old-space-size=${Math.floor(memoryLimitMB)}`;

// For development, use 'dev' instead of 'start'
const isDev = process.argv.includes('--dev');
const npmCommand = isDev ? 'next:dev' : 'next:start';

console.log(`Running npm script: ${npmCommand}`);

// Run npm script with the configured environment
const npmProcess = spawn('npm', ['run', npmCommand], {
  stdio: 'inherit',
  env: process.env,
  shell: true // Use shell on Windows
});

// Handle process signals
npmProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

npmProcess.on('error', (err) => {
  console.error(`Error executing npm: ${err}`);
  process.exit(1);
});

// Forward signals to the child process
process.on('SIGINT', () => {
  npmProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  npmProcess.kill('SIGTERM');
}); 