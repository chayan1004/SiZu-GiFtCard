import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';
import { format } from 'date-fns';

const router = Router();

// Validation schemas
const getAuditLogsSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 100),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  action: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// List audit logs
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const filters = getAuditLogsSchema.parse(req.query);
    const logs = await storage.getAuditLogs(filters.limit, filters);
    
    res.json({
      success: true,
      logs,
      totalCount: logs.length,
      limit: filters.limit,
      offset: filters.offset
    });
  } catch (error: any) {
    console.error('Error listing audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list audit logs'
    });
  }
});

// Export audit logs as CSV
router.get('/export', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const filters = getAuditLogsSchema.parse(req.query);
    const logs = await storage.getAuditLogs(10000, filters); // Get more logs for export
    
    // Generate CSV
    const headers = ['Timestamp', 'Action', 'User ID', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
    const rows = logs.map(log => [
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.userId || '',
      log.entityType || '',
      log.entityId || '',
      JSON.stringify(log.details || {}),
      log.ipAddress || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
});

// Create manual audit log entry (for testing/debugging)
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { action, entityType, entityId, details } = z.object({
      action: z.string(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      details: z.record(z.any()).optional()
    }).parse(req.body);
    
    await storage.createAuditLog({
      action,
      userId: (req as any).user?.claims?.sub || 'system',
      entityType,
      entityId,
      details,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Audit log entry created'
    });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log'
    });
  }
});

// Get audit log statistics
router.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const logs = await storage.getAuditLogs(1000);
    
    // Calculate statistics
    const stats = {
      totalLogs: logs.length,
      actionCounts: {} as Record<string, number>,
      userActivity: {} as Record<string, number>,
      entityTypes: {} as Record<string, number>,
      recentActivity: logs.slice(0, 10)
    };
    
    logs.forEach(log => {
      // Count by action
      stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
      
      // Count by user
      if (log.userId) {
        stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
      }
      
      // Count by entity type
      if (log.entityType) {
        stats.entityTypes[log.entityType] = (stats.entityTypes[log.entityType] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error getting audit log statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log statistics'
    });
  }
});

export const auditLogsRouter = router;