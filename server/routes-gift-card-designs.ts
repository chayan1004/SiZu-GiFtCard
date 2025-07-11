import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';
import { nanoid } from 'nanoid';

const router = Router();

// Validation schemas
const createGiftCardDesignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['birthday', 'holiday', 'thank_you', 'congratulations', 'general', 'premium']),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string().optional()
  }),
  pattern: z.enum(['none', 'dots', 'stripes', 'waves', 'confetti', 'stars', 'hearts']).optional(),
  icon: z.string().optional(),
  animation: z.enum(['none', 'pulse', 'float', 'rotate', 'sparkle']).optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional()
});

const updateGiftCardDesignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string().optional()
  }).optional(),
  pattern: z.string().optional(),
  icon: z.string().optional(),
  animation: z.string().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional()
});

// List gift card designs
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category, isActive, isPremium } = z.object({
      category: z.string().optional(),
      isActive: z.string().optional(),
      isPremium: z.string().optional()
    }).parse(req.query);
    
    let designs = await storage.getGiftCardDesigns();
    
    // Apply filters
    if (category) {
      designs = designs.filter(d => d.category === category);
    }
    if (isActive !== undefined) {
      designs = designs.filter(d => d.isActive === (isActive === 'true'));
    }
    if (isPremium !== undefined) {
      designs = designs.filter(d => d.isPremium === (isPremium === 'true'));
    }
    
    res.json({
      success: true,
      designs,
      totalCount: designs.length
    });
  } catch (error: any) {
    console.error('Error listing gift card designs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list gift card designs'
    });
  }
});

// Get gift card design by ID
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const design = await storage.getGiftCardDesign(id);
    
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Gift card design not found'
      });
    }
    
    res.json({
      success: true,
      design
    });
  } catch (error: any) {
    console.error('Error getting gift card design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get gift card design'
    });
  }
});

// Create gift card design
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const data = createGiftCardDesignSchema.parse(req.body);
    
    const design = await storage.createGiftCardDesign({
      id: nanoid(),
      ...data,
      isActive: data.isActive !== false, // Default to true
      isPremium: data.isPremium || false,
      price: data.price || 0
    });
    
    res.status(201).json({
      success: true,
      design
    });
  } catch (error: any) {
    console.error('Error creating gift card design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create gift card design'
    });
  }
});

// Update gift card design
router.patch('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = updateGiftCardDesignSchema.parse(req.body);
    
    // Check if design exists
    const existing = await storage.getGiftCardDesign(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Gift card design not found'
      });
    }
    
    const design = await storage.updateGiftCardDesign(id, updates);
    
    res.json({
      success: true,
      design
    });
  } catch (error: any) {
    console.error('Error updating gift card design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gift card design'
    });
  }
});

// Delete gift card design
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if design exists
    const existing = await storage.getGiftCardDesign(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Gift card design not found'
      });
    }
    
    await storage.deleteGiftCardDesign(id);
    
    res.json({
      success: true,
      message: 'Gift card design deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting gift card design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete gift card design'
    });
  }
});

// Preview gift card design
router.post('/:id/preview', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, recipientName, message } = z.object({
      amount: z.number().min(1),
      recipientName: z.string().optional(),
      message: z.string().optional()
    }).parse(req.body);
    
    const design = await storage.getGiftCardDesign(id);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Gift card design not found'
      });
    }
    
    // Generate preview data
    const preview = {
      design,
      amount,
      recipientName: recipientName || 'John Doe',
      message: message || 'Enjoy your gift!',
      code: 'PREVIEW-' + nanoid(6).toUpperCase()
    };
    
    res.json({
      success: true,
      preview
    });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview'
    });
  }
});

// Get design statistics
router.get('/:id/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const design = await storage.getGiftCardDesign(id);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Gift card design not found'
      });
    }
    
    // Get usage statistics (would need additional queries in real implementation)
    const stats = {
      designId: id,
      totalSold: 0, // Would count from gift_cards table
      totalRevenue: 0, // Would sum from transactions
      popularAmounts: [25, 50, 100], // Would calculate from data
      lastUsed: null // Would get from gift_cards table
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error getting design statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get design statistics'
    });
  }
});

export const giftCardDesignsRouter = router;