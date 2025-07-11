import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';

const router = Router();

// Validation schemas
const setSystemSettingSchema = z.object({
  value: z.any()
});

// Predefined system settings with their types
const SYSTEM_SETTINGS = {
  // Email settings
  'email.from_address': { type: 'string', category: 'email' },
  'email.from_name': { type: 'string', category: 'email' },
  'email.reply_to': { type: 'string', category: 'email' },
  
  // Gift card settings
  'gift_card.min_amount': { type: 'number', category: 'gift_card' },
  'gift_card.max_amount': { type: 'number', category: 'gift_card' },
  'gift_card.default_expiry_days': { type: 'number', category: 'gift_card' },
  'gift_card.code_format': { type: 'string', category: 'gift_card' },
  
  // Security settings
  'security.max_login_attempts': { type: 'number', category: 'security' },
  'security.session_timeout_minutes': { type: 'number', category: 'security' },
  'security.password_min_length': { type: 'number', category: 'security' },
  'security.require_2fa': { type: 'boolean', category: 'security' },
  
  // Payment settings
  'payment.allowed_methods': { type: 'array', category: 'payment' },
  'payment.currency': { type: 'string', category: 'payment' },
  'payment.tax_rate': { type: 'number', category: 'payment' },
  
  // System settings
  'system.maintenance_mode': { type: 'boolean', category: 'system' },
  'system.maintenance_message': { type: 'string', category: 'system' },
  'system.timezone': { type: 'string', category: 'system' },
  'system.locale': { type: 'string', category: 'system' },
  
  // Analytics settings
  'analytics.tracking_enabled': { type: 'boolean', category: 'analytics' },
  'analytics.retention_days': { type: 'number', category: 'analytics' }
};

// List all system settings
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = z.object({
      category: z.string().optional()
    }).parse(req.query);
    
    const settings: any[] = [];
    
    // Get all settings
    for (const [key, config] of Object.entries(SYSTEM_SETTINGS)) {
      if (category && config.category !== category) {
        continue;
      }
      
      const value = await storage.getSystemSetting(key);
      settings.push({
        key,
        value,
        type: config.type,
        category: config.category,
        isSet: value !== undefined
      });
    }
    
    res.json({
      success: true,
      settings,
      totalCount: settings.length
    });
  } catch (error: any) {
    console.error('Error listing system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list system settings'
    });
  }
});

// Get specific system setting
router.get('/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    // Check if key is valid
    if (!SYSTEM_SETTINGS[key as keyof typeof SYSTEM_SETTINGS]) {
      return res.status(404).json({
        success: false,
        error: 'Invalid system setting key'
      });
    }
    
    const value = await storage.getSystemSetting(key);
    const config = SYSTEM_SETTINGS[key as keyof typeof SYSTEM_SETTINGS];
    
    res.json({
      success: true,
      setting: {
        key,
        value,
        type: config.type,
        category: config.category,
        isSet: value !== undefined
      }
    });
  } catch (error: any) {
    console.error('Error getting system setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system setting'
    });
  }
});

// Set system setting
router.put('/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = setSystemSettingSchema.parse(req.body);
    
    // Check if key is valid
    const config = SYSTEM_SETTINGS[key as keyof typeof SYSTEM_SETTINGS];
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Invalid system setting key'
      });
    }
    
    // Validate value type
    if (config.type === 'number' && typeof value !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Value must be a number'
      });
    }
    if (config.type === 'boolean' && typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Value must be a boolean'
      });
    }
    if (config.type === 'array' && !Array.isArray(value)) {
      return res.status(400).json({
        success: false,
        error: 'Value must be an array'
      });
    }
    
    await storage.setSystemSetting(key, value);
    
    res.json({
      success: true,
      setting: {
        key,
        value,
        type: config.type,
        category: config.category
      }
    });
  } catch (error: any) {
    console.error('Error setting system setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set system setting'
    });
  }
});

// Delete system setting (reset to default)
router.delete('/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    // Check if key is valid
    if (!SYSTEM_SETTINGS[key as keyof typeof SYSTEM_SETTINGS]) {
      return res.status(404).json({
        success: false,
        error: 'Invalid system setting key'
      });
    }
    
    await storage.setSystemSetting(key, null);
    
    res.json({
      success: true,
      message: 'System setting reset to default'
    });
  } catch (error: any) {
    console.error('Error deleting system setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete system setting'
    });
  }
});

// Get settings by category
router.get('/category/:category', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const settings: any[] = [];
    
    // Get settings for the category
    for (const [key, config] of Object.entries(SYSTEM_SETTINGS)) {
      if (config.category !== category) {
        continue;
      }
      
      const value = await storage.getSystemSetting(key);
      settings.push({
        key,
        value,
        type: config.type,
        category: config.category,
        isSet: value !== undefined
      });
    }
    
    res.json({
      success: true,
      category,
      settings,
      totalCount: settings.length
    });
  } catch (error: any) {
    console.error('Error getting settings by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings by category'
    });
  }
});

// Get available setting keys
router.get('/keys/available', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const keys = Object.entries(SYSTEM_SETTINGS).map(([key, config]) => ({
      key,
      type: config.type,
      category: config.category
    }));
    
    res.json({
      success: true,
      keys,
      totalCount: keys.length
    });
  } catch (error: any) {
    console.error('Error getting available keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available keys'
    });
  }
});

export const systemSettingsRouter = router;