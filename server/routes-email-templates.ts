import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';
import { nanoid } from 'nanoid';

const router = Router();

// Validation schemas
const createEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  category: z.enum(['receipt', 'gift_card', 'notification', 'marketing', 'system']),
  isActive: z.boolean().optional()
});

const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional()
});

// Predefined template variables for different categories
const TEMPLATE_VARIABLES = {
  receipt: ['recipientName', 'giftCardCode', 'amount', 'purchaseDate', 'transactionId'],
  gift_card: ['recipientName', 'senderName', 'amount', 'giftCardCode', 'message', 'expiryDate'],
  notification: ['userName', 'message', 'actionUrl', 'date'],
  marketing: ['customerName', 'offerDetails', 'promoCode', 'expiryDate'],
  system: ['userName', 'systemMessage', 'timestamp']
};

// List email templates
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const templates = await storage.getEmailTemplates();
    
    res.json({
      success: true,
      templates,
      totalCount: templates.length
    });
  } catch (error: any) {
    console.error('Error listing email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list email templates'
    });
  }
});

// Get email template by ID
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await storage.getEmailTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error getting email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email template'
    });
  }
});

// Create email template
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const data = createEmailTemplateSchema.parse(req.body);
    
    // Add suggested variables based on category
    const suggestedVariables = TEMPLATE_VARIABLES[data.category as keyof typeof TEMPLATE_VARIABLES] || [];
    
    const template = await storage.createEmailTemplate({
      id: nanoid(),
      ...data,
      variables: data.variables || suggestedVariables,
      isActive: data.isActive !== false // Default to true
    });
    
    res.status(201).json({
      success: true,
      template,
      suggestedVariables
    });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create email template'
    });
  }
});

// Update email template
router.patch('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = updateEmailTemplateSchema.parse(req.body);
    
    // Check if template exists
    const existing = await storage.getEmailTemplate(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }
    
    const template = await storage.updateEmailTemplate(id, updates);
    
    res.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email template'
    });
  }
});

// Delete email template
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const existing = await storage.getEmailTemplate(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }
    
    await storage.deleteEmailTemplate(id);
    
    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email template'
    });
  }
});

// Test email template (send preview)
router.post('/:id/test', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { testEmail, testVariables } = z.object({
      testEmail: z.string().email(),
      testVariables: z.record(z.string()).optional()
    }).parse(req.body);
    
    const template = await storage.getEmailTemplate(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }
    
    // Replace variables in template
    let subject = template.subject;
    let body = template.body;
    
    if (testVariables) {
      Object.entries(testVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, String(value));
        body = body.replace(regex, String(value));
      });
    }
    
    // Send test email
    const { EmailService } = await import('./services/EmailService');
    const emailService = new EmailService();
    
    await emailService.sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html: body
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email'
    });
  }
});

// Get template variables for a category
router.get('/variables/:category', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const variables = TEMPLATE_VARIABLES[category as keyof typeof TEMPLATE_VARIABLES] || [];
    
    res.json({
      success: true,
      category,
      variables
    });
  } catch (error: any) {
    console.error('Error getting template variables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template variables'
    });
  }
});

export const emailTemplatesRouter = router;