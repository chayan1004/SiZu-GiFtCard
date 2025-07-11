/**
 * In-Memory Systems Audit
 * Finds all in-memory storage, caches, and fallback systems
 */

const fs = require('fs');
const path = require('path');

class InMemorySystemsAudit {
  constructor() {
    this.inMemorySystems = [];
    this.fallbackSystems = [];
    this.temporaryData = [];
    this.mockData = [];
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      return null;
    }
  }

  scanDirectory(dir, extensions = ['.ts', '.js']) {
    const results = [];
    
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.test')) {
          results.push(...this.scanDirectory(filePath, extensions));
        } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err.message);
    }
    
    return results;
  }

  findInMemoryPatterns(content, filePath) {
    const patterns = [
      // Map/Set usage
      { regex: /const\s+(\w+)\s*=\s*new\s+(Map|Set)\s*[<(]/g, type: 'In-Memory Collection' },
      { regex: /let\s+(\w+)\s*=\s*new\s+(Map|Set)\s*[<(]/g, type: 'In-Memory Collection' },
      
      // Array/Object as storage
      { regex: /const\s+(\w+)\s*=\s*\[\s*\]\s*;?\s*\/\/[^\n]*storage/gi, type: 'Array Storage' },
      { regex: /const\s+(\w+)\s*=\s*{\s*}\s*;?\s*\/\/[^\n]*storage/gi, type: 'Object Storage' },
      
      // Cache patterns
      { regex: /(\w+)Cache\s*=\s*new\s+Map/g, type: 'Cache System' },
      { regex: /(\w+)Cache\s*=\s*{}/g, type: 'Cache System' },
      { regex: /memoize\(/g, type: 'Memoization' },
      
      // Rate limiting in memory
      { regex: /rateLimit.*Map/gi, type: 'Rate Limiting' },
      { regex: /rateLimit.*=\s*{}/gi, type: 'Rate Limiting' },
      
      // Session storage
      { regex: /session.*Map/gi, type: 'Session Storage' },
      { regex: /sessions?\s*=\s*new\s+Map/gi, type: 'Session Storage' },
      
      // Temporary storage
      { regex: /temp\w*\s*=\s*(\[\]|{}|new\s+(Map|Set))/gi, type: 'Temporary Storage' },
      { regex: /tmp\w*\s*=\s*(\[\]|{}|new\s+(Map|Set))/gi, type: 'Temporary Storage' },
      
      // State management
      { regex: /state\s*=\s*{[^}]*}/g, type: 'State Management' },
      { regex: /store\s*=\s*new\s+Map/g, type: 'State Storage' },
      
      // In-memory queues
      { regex: /queue\s*=\s*\[\]/gi, type: 'Queue' },
      { regex: /queue\s*=\s*new\s+Array/gi, type: 'Queue' }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        this.inMemorySystems.push({
          file: filePath,
          line: lineNumber,
          code: match[0],
          type,
          variable: match[1] || 'unknown'
        });
      }
    });
  }

  findFallbackPatterns(content, filePath) {
    const patterns = [
      // Fallback values
      { regex: /\/\/\s*fallback/gi, type: 'Fallback Comment' },
      { regex: /fallback\s*[:=]/gi, type: 'Fallback Value' },
      { regex: /\|\|\s*['"`][^'"`]+['"`]\s*;?\s*\/\/[^\n]*default/gi, type: 'Default Fallback' },
      
      // Mock data
      { regex: /mock\w*/gi, type: 'Mock Data' },
      { regex: /fake\w*/gi, type: 'Fake Data' },
      { regex: /dummy\w*/gi, type: 'Dummy Data' },
      { regex: /placeholder/gi, type: 'Placeholder' },
      
      // TODO/FIXME
      { regex: /\/\/\s*TODO:/gi, type: 'TODO' },
      { regex: /\/\/\s*FIXME:/gi, type: 'FIXME' },
      { regex: /\/\/\s*HACK:/gi, type: 'HACK' },
      
      // Hardcoded values
      { regex: /hardcoded/gi, type: 'Hardcoded' },
      { regex: /\/\/\s*temporary/gi, type: 'Temporary' },
      
      // Console.log as storage
      { regex: /console\.log\([^)]*\);\s*\/\/\s*store/gi, type: 'Console Storage' }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = content.split('\n')[lineNumber - 1];
        this.fallbackSystems.push({
          file: filePath,
          line: lineNumber,
          code: line.trim(),
          type
        });
      }
    });
  }

  analyzeFile(filePath) {
    const content = this.readFile(filePath);
    if (!content) return;

    this.findInMemoryPatterns(content, filePath);
    this.findFallbackPatterns(content, filePath);
  }

  generateReport() {
    console.log('\n\n📊 IN-MEMORY SYSTEMS AUDIT REPORT\n');
    console.log('='.repeat(60));
    
    console.log(`\n📦 In-Memory Systems Found: ${this.inMemorySystems.length}`);
    console.log(`⚠️  Fallback Systems Found: ${this.fallbackSystems.length}`);
    
    // Group by type
    const inMemoryByType = {};
    this.inMemorySystems.forEach(item => {
      if (!inMemoryByType[item.type]) {
        inMemoryByType[item.type] = [];
      }
      inMemoryByType[item.type].push(item);
    });
    
    console.log('\n📦 IN-MEMORY SYSTEMS BY TYPE:');
    Object.entries(inMemoryByType).forEach(([type, items]) => {
      console.log(`\n${type} (${items.length} instances):`);
      items.forEach(item => {
        console.log(`  - ${path.relative(process.cwd(), item.file)}:${item.line}`);
        console.log(`    Variable: ${item.variable}`);
        console.log(`    Code: ${item.code}`);
      });
    });
    
    // Group fallbacks by type
    const fallbackByType = {};
    this.fallbackSystems.forEach(item => {
      if (!fallbackByType[item.type]) {
        fallbackByType[item.type] = [];
      }
      fallbackByType[item.type].push(item);
    });
    
    console.log('\n\n⚠️  FALLBACK SYSTEMS BY TYPE:');
    Object.entries(fallbackByType).forEach(([type, items]) => {
      console.log(`\n${type} (${items.length} instances):`);
      items.forEach(item => {
        console.log(`  - ${path.relative(process.cwd(), item.file)}:${item.line}`);
        if (item.code.length < 80) {
          console.log(`    Code: ${item.code}`);
        }
      });
    });
    
    // Critical systems that need database replacement
    console.log('\n\n🚨 CRITICAL SYSTEMS NEEDING DATABASE REPLACEMENT:');
    
    const critical = [
      ...this.inMemorySystems.filter(s => 
        s.type === 'Session Storage' || 
        s.type === 'Rate Limiting' ||
        s.type === 'Cache System' ||
        s.type === 'State Storage'
      ),
      ...this.fallbackSystems.filter(s => 
        s.type === 'Mock Data' ||
        s.type === 'Placeholder' ||
        s.type === 'Console Storage'
      )
    ];
    
    critical.forEach(item => {
      console.log(`\n- ${path.relative(process.cwd(), item.file)}:${item.line}`);
      console.log(`  Type: ${item.type}`);
      console.log(`  Variable/Code: ${item.variable || item.code}`);
    });
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        inMemorySystems: this.inMemorySystems.length,
        fallbackSystems: this.fallbackSystems.length,
        criticalSystems: critical.length
      },
      inMemorySystems: this.inMemorySystems,
      fallbackSystems: this.fallbackSystems,
      criticalSystems: critical
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'in-memory-systems-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n\n✅ Report saved to in-memory-systems-report.json');
  }

  run() {
    console.log('🔍 IN-MEMORY SYSTEMS AUDIT');
    console.log('='.repeat(60));
    
    const serverDir = path.join(__dirname, '../../server');
    const files = this.scanDirectory(serverDir);
    
    console.log(`\nScanning ${files.length} files...\n`);
    
    files.forEach(file => {
      this.analyzeFile(file);
    });
    
    this.generateReport();
  }
}

// Run the audit
const audit = new InMemorySystemsAudit();
audit.run();