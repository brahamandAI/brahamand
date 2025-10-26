#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envFile = '.env.production';

console.log('🔍 Running pre-commit checks...\n');

// Check 1: .env.production exists
if (!fs.existsSync(envFile)) {
    console.error('❌ Error: .env.production file is missing!');
    console.error('✍️ Please create .env.production before committing.');
    console.error('or 👉 RUN node scripts/env-manager.js decrypt .env.production.encrypted');
    process.exit(1);
}
console.log('✅ .env.production file exists');

// Check 2: .env.git exists and contains ENCRYPTION_KEY
if (!fs.existsSync('.env.git')) {
    console.error('❌ Error: .env.git file is missing!');
    console.error('Please create .env.git with ENCRYPTION_KEY before committing.');
    process.exit(1);
}

const envGitContent = fs.readFileSync('.env.git', 'utf8');
if (!envGitContent.includes('ENCRYPTION_KEY=')) {
    console.error('❌ Error: ENCRYPTION_KEY not found in .env.git!');
    console.error('Please add ENCRYPTION_KEY to .env.git before committing.');
    process.exit(1);
}
console.log('✅ ENCRYPTION_KEY found in .env.git');

// Check 3: Run encryption
try {
    console.log('🔐 Encrypting .env.production...');
    execSync('node scripts/env-manager.js encrypt .env.production', { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    console.log('✅ .env.production encrypted successfully');
} catch (error) {
    console.error('❌ Error: Failed to encrypt .env.production');
    console.error('Encryption error:', error.message);
    process.exit(1);
}

// Step 4: Auto-stage the encrypted file
try {
    console.log('📝 Staging encrypted file...');
    execSync('git add .env.production.encrypted', { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    console.log('✅ Encrypted file staged successfully');
} catch (error) {
    console.error('❌ Error: Failed to stage encrypted file');
    console.error('Error:', error.message);
    process.exit(1);
}

console.log('\n🎉 All pre-commit checks passed! Ready to commit.');
process.exit(0);
