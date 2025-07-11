#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script
 * Checks for vulnerabilities, exposed secrets, injection flaws, and security issues
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔒 COMPREHENSIVE SECURITY AUDIT STARTING...\n');

// Color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}═══ ${title} ═══${colors.reset}`);
}

let securityIssues = [];
let warnings = [];
let passed = [];

function addIssue(category, description, severity = 'high') {
  securityIssues.push({ category, description, severity });
  log(`❌ ${category}: ${description}`, 'red');
}

function addWarning(category, description) {
  warnings.push({ category, description });
  log(`⚠️  ${category}: ${description}`, 'yellow');
}

function addPass(category, description) {
  passed.push({ category, description });
  log(`✅ ${category}: ${description}`, 'green');
}

// 1. SECRET DETECTION
section('SECRET DETECTION');

const secretPatterns = [
  { name: 'API Keys', pattern: /['"](sk_|pk_|rk_)[a-zA-Z0-9]{20,}['"]/, severity: 'critical' },
  { name: 'Square Access Token', pattern: /EAAA[a-zA-Z0-9_-]{60,}/, severity: 'critical' },
  { name: 'Database URLs', pattern: /postgresql:\/\/[^"'\s]+/, severity: 'high' },
  { name: 'JWT Secrets', pattern: /(jwt[_-]?secret|secret[_-]?key)['":\s=]+[a-zA-Z0-9+/=]{20,}/i, severity: 'high' },
  { name: 'AWS Keys', pattern: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
  { name: 'Generic Secrets', pattern: /(password|secret|key|token)['":\s=]+[a-zA-Z0-9+/=]{16,}/i, severity: 'medium' },
  { name: 'Email Credentials', pattern: /(smtp[_-]?password|mailgun[_-]?key)['":\s=]+[a-zA-Z0-9+/=]{10,}/i, severity: 'high' }
];

function scanFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    secretPatterns.forEach(({ name, pattern, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: name,
          severity,
          line: content.substring(0, content.indexOf(matches[0])).split('\n').length,
          file: filePath
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
}

function scanForSecrets() {
  const filesToScan = [
    'server/index.ts',
    'server/routes.ts',
    'server/storage.ts',
    '.env',
    '.env.local',
    '.env.production',
    'package.json',
    'client/src/**/*.tsx',
    'client/src/**/*.ts'
  ];
  
  let secretsFound = false;
  
  // Get all TypeScript/JavaScript files
  try {
    const files = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name ".env*" | grep -v node_modules | head -100', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim());
    
    files.forEach(file => {
      const issues = scanFileForSecrets(file);
      issues.forEach(issue => {
        addIssue('Secret Exposure', `${issue.type} found in ${issue.file}:${issue.line}`, issue.severity);
        secretsFound = true;
      });
    });
    
    if (!secretsFound) {
      addPass('Secret Detection', 'No hardcoded secrets detected in source code');
    }
  } catch (error) {
    addWarning('Secret Detection', 'Unable to scan all files for secrets');
  }
}

scanForSecrets();

// 2. DEPENDENCY VULNERABILITIES
section('DEPENDENCY VULNERABILITIES');

try {
  // Check for npm audit
  const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
    Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
      const severity = vuln.severity;
      if (severity === 'critical' || severity === 'high') {
        addIssue('Dependency Vulnerability', `${pkg}: ${severity} vulnerability`, severity);
      } else {
        addWarning('Dependency Vulnerability', `${pkg}: ${severity} vulnerability`);
      }
    });
  } else {
    addPass('Dependencies', 'No known vulnerabilities in dependencies');
  }
} catch (error) {
  try {
    // Fallback: check for known vulnerable packages
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const knownVulnerable = [
      'lodash@<4.17.19',
      'moment@<2.29.4',
      'express@<4.18.0',
      'jsonwebtoken@<9.0.0'
    ];
    
    let vulnerableFound = false;
    Object.entries(packageJson.dependencies || {}).forEach(([pkg, version]) => {
      // Simple version check for known vulnerabilities
      if (pkg === 'express' && version.includes('4.17')) {
        addWarning('Dependencies', `${pkg}@${version} may have known vulnerabilities`);
        vulnerableFound = true;
      }
    });
    
    if (!vulnerableFound) {
      addPass('Dependencies', 'Manual check: No obviously vulnerable packages detected');
    }
  } catch (err) {
    addWarning('Dependencies', 'Unable to check dependency vulnerabilities');
  }
}

// 3. SQL INJECTION PROTECTION
section('SQL INJECTION PROTECTION');

function checkSQLInjectionProtection() {
  try {
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    const storageContent = fs.readFileSync('server/storage.ts', 'utf8');
    
    // Check for parameterized queries
    const hasParameterizedQueries = storageContent.includes('$1') || storageContent.includes('placeholder');
    const hasRawQueries = /\.(query|exec|run)\s*\(\s*[`'"].*\$\{/.test(storageContent);
    
    if (hasRawQueries) {
      addIssue('SQL Injection', 'Raw SQL queries with string interpolation detected', 'high');
    } else {
      addPass('SQL Injection', 'No obvious SQL injection vulnerabilities detected');
    }
    
    // Check for input validation
    const hasInputValidation = routesContent.includes('validateGiftCardCode') || 
                               routesContent.includes('validateEmail') ||
                               routesContent.includes('zod');
    
    if (hasInputValidation) {
      addPass('Input Validation', 'Input validation middleware detected');
    } else {
      addWarning('Input Validation', 'Limited input validation detected');
    }
    
  } catch (error) {
    addWarning('SQL Injection', 'Unable to analyze SQL injection protection');
  }
}

checkSQLInjectionProtection();

// 4. AUTHENTICATION & AUTHORIZATION
section('AUTHENTICATION & AUTHORIZATION');

function checkAuthSecurity() {
  try {
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    const authContent = fs.readFileSync('server/replitAuth.ts', 'utf8');
    
    // Check for authentication middleware
    const hasAuthMiddleware = routesContent.includes('isAuthenticated') || 
                             routesContent.includes('requireAuth');
    
    if (hasAuthMiddleware) {
      addPass('Authentication', 'Authentication middleware detected');
    } else {
      addIssue('Authentication', 'No authentication middleware detected', 'high');
    }
    
    // Check for session security
    const hasSecureSession = authContent.includes('secure:') && 
                            authContent.includes('httpOnly:') &&
                            authContent.includes('sameSite:');
    
    if (hasSecureSession) {
      addPass('Session Security', 'Secure session configuration detected');
    } else {
      addWarning('Session Security', 'Session security configuration needs review');
    }
    
    // Check for CSRF protection
    const hasCSRFProtection = routesContent.includes('csrf') || 
                             routesContent.includes('sameSite');
    
    if (hasCSRFProtection) {
      addPass('CSRF Protection', 'CSRF protection measures detected');
    } else {
      addWarning('CSRF Protection', 'CSRF protection not explicitly implemented');
    }
    
  } catch (error) {
    addWarning('Authentication', 'Unable to analyze authentication security');
  }
}

checkAuthSecurity();

// 5. CORS & SECURITY HEADERS
section('CORS & SECURITY HEADERS');

function checkSecurityHeaders() {
  try {
    const serverContent = fs.readFileSync('server/index.ts', 'utf8');
    
    // Check for security headers
    const hasHelmet = serverContent.includes('helmet') || 
                     serverContent.includes('X-Frame-Options') ||
                     serverContent.includes('Content-Security-Policy');
    
    if (hasHelmet) {
      addPass('Security Headers', 'Security headers middleware detected');
    } else {
      addWarning('Security Headers', 'Missing security headers (helmet, CSP, etc.)');
    }
    
    // Check CORS configuration
    const hasCORSConfig = serverContent.includes('cors') && 
                         serverContent.includes('origin');
    
    if (hasCORSConfig) {
      addPass('CORS', 'CORS configuration detected');
    } else {
      addWarning('CORS', 'CORS configuration needs review');
    }
    
  } catch (error) {
    addWarning('Security Headers', 'Unable to analyze security headers');
  }
}

checkSecurityHeaders();

// 6. RATE LIMITING
section('RATE LIMITING');

function checkRateLimiting() {
  try {
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    
    const hasRateLimit = routesContent.includes('rateLimit') || 
                        routesContent.includes('Rate limit') ||
                        routesContent.includes('generalRateLimit');
    
    if (hasRateLimit) {
      addPass('Rate Limiting', 'Rate limiting implementation detected');
    } else {
      addIssue('Rate Limiting', 'No rate limiting detected - API vulnerable to abuse', 'medium');
    }
    
  } catch (error) {
    addWarning('Rate Limiting', 'Unable to analyze rate limiting');
  }
}

checkRateLimiting();

// 7. FILE UPLOAD SECURITY
section('FILE UPLOAD SECURITY');

function checkFileUploadSecurity() {
  try {
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    
    const hasFileUpload = routesContent.includes('multer') || 
                         routesContent.includes('upload') ||
                         routesContent.includes('multipart');
    
    if (hasFileUpload) {
      const hasFileValidation = routesContent.includes('fileFilter') || 
                               routesContent.includes('mimetype') ||
                               routesContent.includes('limits');
      
      if (hasFileValidation) {
        addPass('File Upload', 'File upload validation detected');
      } else {
        addIssue('File Upload', 'File upload without proper validation detected', 'medium');
      }
    } else {
      addPass('File Upload', 'No file upload functionality detected');
    }
    
  } catch (error) {
    addWarning('File Upload', 'Unable to analyze file upload security');
  }
}

checkFileUploadSecurity();

// 8. ENVIRONMENT CONFIGURATION
section('ENVIRONMENT CONFIGURATION');

function checkEnvironmentSecurity() {
  try {
    // Check if .env files are properly gitignored
    const gitignoreExists = fs.existsSync('.gitignore');
    if (gitignoreExists) {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      if (gitignoreContent.includes('.env')) {
        addPass('Environment', '.env files are gitignored');
      } else {
        addIssue('Environment', '.env files not in .gitignore', 'high');
      }
    } else {
      addWarning('Environment', 'No .gitignore file detected');
    }
    
    // Check for production vs development config
    const serverContent = fs.readFileSync('server/index.ts', 'utf8');
    const hasEnvCheck = serverContent.includes('NODE_ENV') || 
                       serverContent.includes('process.env');
    
    if (hasEnvCheck) {
      addPass('Environment', 'Environment-based configuration detected');
    } else {
      addWarning('Environment', 'No environment-based configuration detected');
    }
    
  } catch (error) {
    addWarning('Environment', 'Unable to analyze environment configuration');
  }
}

checkEnvironmentSecurity();

// 9. PRODUCTION READINESS
section('PRODUCTION READINESS');

function checkProductionReadiness() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for build script
    const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
    if (hasBuildScript) {
      addPass('Production', 'Build script configured');
    } else {
      addWarning('Production', 'No build script detected');
    }
    
    // Check for start script
    const hasStartScript = packageJson.scripts && packageJson.scripts.start;
    if (hasStartScript) {
      addPass('Production', 'Start script configured');
    } else {
      addWarning('Production', 'No production start script detected');
    }
    
    // Check for TypeScript compilation
    const hasTSConfig = fs.existsSync('tsconfig.json');
    if (hasTSConfig) {
      addPass('Production', 'TypeScript configuration detected');
    } else {
      addWarning('Production', 'No TypeScript configuration detected');
    }
    
  } catch (error) {
    addWarning('Production', 'Unable to analyze production readiness');
  }
}

checkProductionReadiness();

// 10. LOGGING & MONITORING
section('LOGGING & MONITORING');

function checkLoggingMonitoring() {
  try {
    const serverContent = fs.readFileSync('server/index.ts', 'utf8');
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    
    // Check for error handling
    const hasErrorHandling = serverContent.includes('catch') && 
                            serverContent.includes('console.error');
    
    if (hasErrorHandling) {
      addPass('Error Handling', 'Error handling detected');
    } else {
      addWarning('Error Handling', 'Limited error handling detected');
    }
    
    // Check for request logging
    const hasRequestLogging = routesContent.includes('console.log') || 
                             routesContent.includes('log(');
    
    if (hasRequestLogging) {
      addPass('Logging', 'Request logging detected');
    } else {
      addWarning('Logging', 'Limited request logging detected');
    }
    
  } catch (error) {
    addWarning('Logging', 'Unable to analyze logging configuration');
  }
}

checkLoggingMonitoring();

// FINAL REPORT
section('SECURITY AUDIT SUMMARY');

console.log(`\n${colors.bold}📊 SECURITY AUDIT RESULTS:${colors.reset}`);
console.log(`${colors.green}✅ Passed: ${passed.length}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnings.length}${colors.reset}`);
console.log(`${colors.red}❌ Issues: ${securityIssues.length}${colors.reset}`);

// Critical issues
const criticalIssues = securityIssues.filter(issue => issue.severity === 'critical');
const highIssues = securityIssues.filter(issue => issue.severity === 'high');

if (criticalIssues.length > 0) {
  log(`\n🚨 CRITICAL ISSUES (${criticalIssues.length}):`, 'red');
  criticalIssues.forEach(issue => {
    log(`   • ${issue.category}: ${issue.description}`, 'red');
  });
}

if (highIssues.length > 0) {
  log(`\n⚠️  HIGH PRIORITY ISSUES (${highIssues.length}):`, 'yellow');
  highIssues.forEach(issue => {
    log(`   • ${issue.category}: ${issue.description}`, 'yellow');
  });
}

// Security score calculation
const totalChecks = passed.length + warnings.length + securityIssues.length;
const securityScore = totalChecks > 0 ? Math.round((passed.length / totalChecks) * 100) : 0;

log(`\n🏆 SECURITY SCORE: ${securityScore}%`, securityScore >= 80 ? 'green' : securityScore >= 60 ? 'yellow' : 'red');

// Deployment recommendation
if (criticalIssues.length === 0 && highIssues.length <= 2) {
  log('\n🚀 DEPLOYMENT RECOMMENDATION: APPROVED', 'green');
  log('   Application has acceptable security posture for deployment', 'green');
} else {
  log('\n🛑 DEPLOYMENT RECOMMENDATION: NEEDS ATTENTION', 'red');
  log('   Address critical and high-priority issues before deployment', 'red');
}

// Save report to file
const report = {
  timestamp: new Date().toISOString(),
  securityScore,
  passed: passed.length,
  warnings: warnings.length,
  issues: securityIssues.length,
  criticalIssues: criticalIssues.length,
  details: { passed, warnings, issues: securityIssues }
};

fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
log('\n📄 Detailed report saved to: security-audit-report.json', 'cyan');

process.exit(criticalIssues.length > 0 ? 1 : 0);