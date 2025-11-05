#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if the project is properly configured
 */

const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath)
  const status = exists ? '✓' : '✗'
  const color = exists ? colors.green : required ? colors.red : colors.yellow
  const label = required ? 'Required' : 'Optional'
  
  log(`${status} ${filePath} ${exists ? '' : `(${label} - Missing)`}`, color)
  return exists
}

function checkEnvVariable(varName) {
  // Check .env.local file
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    log(`✗ .env.local file not found`, colors.red)
    return false
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const hasVar = envContent.includes(`${varName}=`)
  const hasPlaceholder = envContent.includes('your_') || envContent.includes('_here')
  
  if (!hasVar) {
    log(`✗ ${varName} not found in .env.local`, colors.red)
    return false
  }
  
  if (hasPlaceholder && varName === 'OPENAI_API_KEY') {
    log(`⚠ ${varName} appears to be a placeholder`, colors.yellow)
    return false
  }
  
  log(`✓ ${varName} configured`, colors.green)
  return true
}

console.log('\n' + '='.repeat(50))
log('AI Chatbot Setup Verification', colors.blue)
console.log('='.repeat(50) + '\n')

// Check Node.js version
log('Checking Node.js version...', colors.blue)
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
if (majorVersion >= 18) {
  log(`✓ Node.js ${nodeVersion} (>= 18.0.0)`, colors.green)
} else {
  log(`✗ Node.js ${nodeVersion} (requires >= 18.0.0)`, colors.red)
}
console.log()

// Check essential files
log('Checking project files...', colors.blue)
const essentialFiles = [
  'package.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.js',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/api/chat/route.ts',
  'src/app/api/ads/route.ts',
]

let allFilesExist = true
essentialFiles.forEach(file => {
  if (!checkFile(file, true)) {
    allFilesExist = false
  }
})
console.log()

// Check environment variables
log('Checking environment configuration...', colors.blue)
const openaiConfigured = checkEnvVariable('OPENAI_API_KEY')
const serpapiConfigured = checkEnvVariable('SERPAPI_KEY')
console.log()

// Check node_modules
log('Checking dependencies...', colors.blue)
const nodeModulesExists = checkFile('node_modules', false)
if (!nodeModulesExists) {
  log('⚠ Dependencies not installed. Run: npm install', colors.yellow)
}
console.log()

// Summary
console.log('='.repeat(50))
log('Summary', colors.blue)
console.log('='.repeat(50))

if (allFilesExist && openaiConfigured && serpapiConfigured) {
  log('\n✓ Setup complete! You\'re ready to run the app.', colors.green)
  log('\nRun: npm run dev', colors.blue)
} else {
  log('\n✗ Setup incomplete. Please fix the issues above.', colors.red)
  
  if (!openaiConfigured) {
    log('\nAction needed:', colors.yellow)
    log('1. Create .env.local file in the root directory', colors.yellow)
    log('2. Add your OpenAI API key:', colors.yellow)
    log('   OPENAI_API_KEY=sk-your-actual-key-here', colors.yellow)
    log('3. Get your key from: https://platform.openai.com/api-keys', colors.yellow)
  }
  
  if (!nodeModulesExists) {
    log('\nRun: npm install', colors.yellow)
  }
}

console.log()

