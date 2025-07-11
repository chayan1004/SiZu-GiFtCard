/**
 * Comprehensive Database Feature Audit
 * Identifies all missing database features and implementations
 */

const fs = require('fs');
const path = require('path');

class DatabaseFeatureAudit {
  constructor() {
    this.missingFeatures = [];
    this.implementedFeatures = [];
    this.placeholderImplementations = [];
  }

  // Read file content
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      return null;
    }
  }

  // Check storage.ts for missing implementations
  auditStorageImplementations() {
    console.log('\n📋 AUDITING STORAGE IMPLEMENTATIONS...\n');
    
    const storagePath = path.join(__dirname, '../../server/storage.ts');
    const storageContent = this.readFile(storagePath);
    
    if (!storageContent) {
      console.log('❌ Could not read storage.ts');
      return;
    }

    // Extract interface methods
    const interfaceMatch = storageContent.match(/interface IStorage\s*{([^}]*)}/s);
    if (!interfaceMatch) {
      console.log('❌ Could not find IStorage interface');
      return;
    }

    const interfaceMethods = interfaceMatch[1]
      .split('\n')
      .filter(line => line.includes('(') && line.includes(':'))
      .map(line => {
        const match = line.trim().match(/(\w+)\s*\(/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    console.log(`Found ${interfaceMethods.length} methods in IStorage interface\n`);

    // Check each method implementation
    interfaceMethods.forEach(method => {
      const implementationRegex = new RegExp(`async\\s+${method}\\s*\\([^)]*\\)\\s*[^{]*{([^}]+)}`, 's');
      const match = storageContent.match(implementationRegex);
      
      if (!match) {
        this.missingFeatures.push({
          category: 'Storage Implementation',
          feature: method,
          type: 'MISSING_IMPLEMENTATION'
        });
        console.log(`❌ ${method}: No implementation found`);
      } else {
        const implementation = match[1];
        if (implementation.includes('console.log') || 
            implementation.includes('TODO') || 
            implementation.includes('mock') ||
            implementation.includes('// ')) {
          this.placeholderImplementations.push({
            category: 'Storage Implementation',
            feature: method,
            type: 'PLACEHOLDER'
          });
          console.log(`⚠️  ${method}: Placeholder implementation`);
        } else {
          this.implementedFeatures.push(method);
          console.log(`✅ ${method}: Implemented`);
        }
      }
    });
  }

  // Audit webhook handlers for database storage
  auditWebhookHandlers() {
    console.log('\n📋 AUDITING WEBHOOK HANDLERS...\n');
    
    const webhookServicePath = path.join(__dirname, '../../server/services/SquareWebhookService.ts');
    const webhookContent = this.readFile(webhookServicePath);
    
    if (!webhookContent) {
      console.log('❌ Could not read SquareWebhookService.ts');
      return;
    }

    // Find all webhook handlers
    const handlers = webhookContent.match(/private async handle\w+\(event: WebhookEvent\)/g) || [];
    
    console.log(`Found ${handlers.length} webhook handlers\n`);

    handlers.forEach(handler => {
      const handlerName = handler.match(/handle(\w+)/)[1];
      
      // Check if handler stores data in database
      const handlerRegex = new RegExp(`${handler.replace(/[()]/g, '\\$&')}[^{]*{([^}]+)}`, 's');
      const match = webhookContent.match(handlerRegex);
      
      if (match) {
        const implementation = match[1];
        if (!implementation.includes('storage.') && 
            !implementation.includes('db.') &&
            !implementation.includes('await') &&
            implementation.includes('console.log')) {
          this.missingFeatures.push({
            category: 'Webhook Handler',
            feature: `handle${handlerName}`,
            type: 'NO_DATABASE_STORAGE'
          });
          console.log(`❌ handle${handlerName}: No database storage`);
        } else {
          console.log(`✅ handle${handlerName}: Has database storage`);
        }
      }
    });
  }

  // Check for missing table operations
  auditTableOperations() {
    console.log('\n📋 AUDITING TABLE OPERATIONS...\n');
    
    const schemaPath = path.join(__dirname, '../../shared/schema.ts');
    const schemaContent = this.readFile(schemaPath);
    
    if (!schemaContent) {
      console.log('❌ Could not read schema.ts');
      return;
    }

    // Extract all table names
    const tables = schemaContent.match(/export const (\w+) = pgTable/g) || [];
    const tableNames = tables.map(t => t.match(/const (\w+)/)[1]);
    
    console.log(`Found ${tableNames.length} tables in schema\n`);

    // Check which tables have CRUD operations in storage
    const storageContent = this.readFile(path.join(__dirname, '../../server/storage.ts'));
    
    tableNames.forEach(table => {
      const hasCreate = storageContent.includes(`insert().into(${table})`);
      const hasRead = storageContent.includes(`select().from(${table})`);
      const hasUpdate = storageContent.includes(`update(${table})`);
      const hasDelete = storageContent.includes(`delete().from(${table})`);
      
      const operations = [];
      if (!hasCreate) operations.push('CREATE');
      if (!hasRead) operations.push('READ');
      if (!hasUpdate) operations.push('UPDATE');
      if (!hasDelete) operations.push('DELETE');
      
      if (operations.length > 0) {
        this.missingFeatures.push({
          category: 'Table Operations',
          feature: table,
          type: 'MISSING_OPERATIONS',
          details: operations.join(', ')
        });
        console.log(`❌ ${table}: Missing ${operations.join(', ')}`);
      } else {
        console.log(`✅ ${table}: Full CRUD operations`);
      }
    });
  }

  // Check admin page requirements
  auditAdminPageRequirements() {
    console.log('\n📋 AUDITING ADMIN PAGE REQUIREMENTS...\n');
    
    const adminPages = [
      'AdminDisputes',
      'AdminRefunds',
      'AdminPaymentLinks',
      'AdminWebhooks',
      'AdminEmailTemplates',
      'AdminGiftCardDesigns',
      'AdminSystemSettings',
      'AdminAuditLogs',
      'AdminDatabaseTools'
    ];

    const expectedEndpoints = {
      'AdminDisputes': ['/api/disputes', '/api/disputes/:id', '/api/disputes/:id/accept'],
      'AdminRefunds': ['/api/refunds', '/api/refunds/create', '/api/refunds/:id'],
      'AdminPaymentLinks': ['/api/payment-links', '/api/payment-links/:id'],
      'AdminWebhooks': ['/api/webhooks/subscriptions', '/api/webhooks/test'],
      'AdminEmailTemplates': ['/api/email-templates', '/api/email-templates/:id'],
      'AdminGiftCardDesigns': ['/api/gift-card-designs', '/api/gift-card-designs/:id'],
      'AdminSystemSettings': ['/api/system-settings', '/api/system-settings/:key'],
      'AdminAuditLogs': ['/api/audit-logs', '/api/audit-logs/export'],
      'AdminDatabaseTools': ['/api/admin/database/backup', '/api/admin/database/optimize']
    };

    const routesContent = this.readFile(path.join(__dirname, '../../server/routes.ts'));
    
    Object.entries(expectedEndpoints).forEach(([page, endpoints]) => {
      console.log(`\n${page}:`);
      endpoints.forEach(endpoint => {
        const routePattern = endpoint.replace(/:[^/]+/g, ':[^/]+');
        const hasRoute = routesContent.includes(endpoint.replace(/:[^/]+/g, '')) ||
                        routesContent.match(new RegExp(routePattern));
        
        if (!hasRoute) {
          this.missingFeatures.push({
            category: 'Admin Page Endpoint',
            feature: `${page} - ${endpoint}`,
            type: 'MISSING_ENDPOINT'
          });
          console.log(`  ❌ ${endpoint}: Missing`);
        } else {
          console.log(`  ✅ ${endpoint}: Exists`);
        }
      });
    });
  }

  // Check for service integrations
  auditServiceIntegrations() {
    console.log('\n📋 AUDITING SERVICE INTEGRATIONS...\n');
    
    const services = [
      { name: 'EmailService', requiredMethods: ['sendEmail', 'sendTemplatedEmail'] },
      { name: 'PDFService', requiredMethods: ['generateReceipt', 'generateReport'] },
      { name: 'SquarePaymentsService', requiredMethods: ['createPayment', 'getPayment'] },
      { name: 'SquareRefundsService', requiredMethods: ['createRefund', 'getRefund'] },
      { name: 'SquareDisputesService', requiredMethods: ['listDisputes', 'acceptDispute'] }
    ];

    services.forEach(service => {
      const servicePath = path.join(__dirname, `../../server/services/${service.name}.ts`);
      const serviceContent = this.readFile(servicePath);
      
      if (!serviceContent) {
        console.log(`❌ ${service.name}: File not found`);
        return;
      }

      console.log(`\n${service.name}:`);
      service.requiredMethods.forEach(method => {
        const hasMethod = serviceContent.includes(`async ${method}(`);
        if (!hasMethod) {
          this.missingFeatures.push({
            category: 'Service Method',
            feature: `${service.name}.${method}`,
            type: 'MISSING_METHOD'
          });
          console.log(`  ❌ ${method}: Missing`);
        } else {
          console.log(`  ✅ ${method}: Exists`);
        }
      });
    });
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n\n📊 COMPREHENSIVE DATABASE FEATURE AUDIT REPORT\n');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Implemented Features: ${this.implementedFeatures.length}`);
    console.log(`⚠️  Placeholder Implementations: ${this.placeholderImplementations.length}`);
    console.log(`❌ Missing Features: ${this.missingFeatures.length}`);
    
    if (this.placeholderImplementations.length > 0) {
      console.log('\n⚠️  PLACEHOLDER IMPLEMENTATIONS:');
      this.placeholderImplementations.forEach(item => {
        console.log(`  - ${item.category}: ${item.feature}`);
      });
    }
    
    if (this.missingFeatures.length > 0) {
      console.log('\n❌ MISSING FEATURES BY CATEGORY:');
      const byCategory = {};
      this.missingFeatures.forEach(item => {
        if (!byCategory[item.category]) {
          byCategory[item.category] = [];
        }
        byCategory[item.category].push(item);
      });
      
      Object.entries(byCategory).forEach(([category, items]) => {
        console.log(`\n${category}:`);
        items.forEach(item => {
          const details = item.details ? ` (${item.details})` : '';
          console.log(`  - ${item.feature}${details}`);
        });
      });
    }
    
    // Generate action items
    console.log('\n\n📝 ACTION ITEMS:');
    console.log('1. Implement missing storage methods');
    console.log('2. Add database storage to webhook handlers');
    console.log('3. Create missing API endpoints for admin pages');
    console.log('4. Implement CRUD operations for all tables');
    console.log('5. Complete service method implementations');
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        implemented: this.implementedFeatures.length,
        placeholders: this.placeholderImplementations.length,
        missing: this.missingFeatures.length
      },
      placeholderImplementations: this.placeholderImplementations,
      missingFeatures: this.missingFeatures
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'database-feature-audit-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n✅ Report saved to database-feature-audit-report.json');
  }

  // Run all audits
  runAudit() {
    console.log('🔍 COMPREHENSIVE DATABASE FEATURE AUDIT');
    console.log('='.repeat(60));
    
    this.auditStorageImplementations();
    this.auditWebhookHandlers();
    this.auditTableOperations();
    this.auditAdminPageRequirements();
    this.auditServiceIntegrations();
    this.generateReport();
  }
}

// Run the audit
const audit = new DatabaseFeatureAudit();
audit.runAudit();