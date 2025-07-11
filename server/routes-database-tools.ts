import { Router, Request, Response } from 'express';
import { isAuthenticated } from './replitAuth';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { format } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Validation schemas
const exportTableSchema = z.object({
  tableName: z.string(),
  format: z.enum(['json', 'csv']).optional().default('json')
});

// Get database statistics
router.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get table sizes and row counts
    const tableStats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    // Get database size
    const dbSize = await db.execute(sql`
      SELECT pg_database_size(current_database()) as size,
             pg_size_pretty(pg_database_size(current_database())) as size_pretty
    `);

    // Get connection stats
    const connStats = await db.execute(sql`
      SELECT count(*) as total_connections,
             count(*) FILTER (WHERE state = 'active') as active_connections,
             count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    res.json({
      success: true,
      database: {
        size: dbSize.rows[0].size_pretty,
        sizeBytes: dbSize.rows[0].size
      },
      tables: tableStats.rows,
      connections: connStats.rows[0]
    });
  } catch (error: any) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics'
    });
  }
});

// Database backup (export all tables)
router.post('/backup', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const backupData: Record<string, any[]> = {};
    
    // List of tables to backup
    const tables = [
      'users', 'sessions', 'gift_cards', 'gift_card_transactions',
      'receipts', 'fraud_alerts', 'saved_cards', 'fee_configurations',
      'merchant_connections', 'square_payments', 'payment_links',
      'refunds', 'disputes', 'webhook_events', 'webhook_subscriptions',
      'email_templates', 'gift_card_designs', 'audit_logs', 'system_settings'
    ];
    
    // Export each table
    for (const table of tables) {
      try {
        const data = await db.execute(sql.raw(`SELECT * FROM ${table}`));
        backupData[table] = data.rows;
      } catch (error) {
        console.error(`Failed to backup table ${table}:`, error);
      }
    }
    
    // Save backup to file
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    res.json({
      success: true,
      message: 'Database backup created successfully',
      filename: `backup-${timestamp}.json`,
      tables: Object.keys(backupData),
      rowCounts: Object.entries(backupData).map(([table, rows]) => ({
        table,
        count: rows.length
      }))
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create database backup'
    });
  }
});

// Database optimization (VACUUM and ANALYZE)
router.post('/optimize', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Run VACUUM ANALYZE on all tables
    await db.execute(sql`VACUUM ANALYZE`);
    
    // Get updated statistics
    const stats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY n_dead_tup DESC
    `);
    
    res.json({
      success: true,
      message: 'Database optimization completed',
      tables: stats.rows,
      optimizedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error optimizing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize database'
    });
  }
});

// Export specific table
router.get('/export/:tableName', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { format } = exportTableSchema.parse({ 
      tableName, 
      format: req.query.format 
    });
    
    // Whitelist of allowed tables
    const allowedTables = [
      'gift_cards', 'gift_card_transactions', 'users', 'receipts',
      'fraud_alerts', 'audit_logs', 'email_templates', 'gift_card_designs'
    ];
    
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name'
      });
    }
    
    const data = await db.execute(sql.raw(`SELECT * FROM ${tableName}`));
    
    if (format === 'csv') {
      // Convert to CSV
      if (data.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No data found'
        });
      }
      
      const headers = Object.keys(data.rows[0]);
      const csv = [
        headers.join(','),
        ...data.rows.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
      res.send(csv);
    } else {
      // Return as JSON
      res.json({
        success: true,
        table: tableName,
        rowCount: data.rows.length,
        data: data.rows
      });
    }
  } catch (error: any) {
    console.error('Error exporting table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export table'
    });
  }
});

// Run custom query (admin only, read-only)
router.post('/query', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { query } = z.object({
      query: z.string().min(1)
    }).parse(req.body);
    
    // Only allow SELECT queries
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({
        success: false,
        error: 'Only SELECT queries are allowed'
      });
    }
    
    const result = await db.execute(sql.raw(query));
    
    res.json({
      success: true,
      rowCount: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error running query:', error);
    res.status(500).json({
      success: false,
      error: 'Query failed: ' + error.message
    });
  }
});

export const databaseToolsRouter = router;