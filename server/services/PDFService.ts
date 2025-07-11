import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export class PDFService {
  private async createReceiptPDF(receiptData: any, qrCodeDataUrl?: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    
    // Header
    page.drawText('SiZu GiftCard Receipt', {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Date
    page.drawText(`Date: ${new Date(receiptData.timestamp).toLocaleDateString()}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Transaction details
    let yPosition = height - 120;
    
    if (receiptData.type === 'redemption') {
      page.drawText('Gift Card Redemption', {
        x: 50,
        y: yPosition,
        size: 18,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      yPosition -= 40;
      
      page.drawText(`Gift Card Code: ${receiptData.giftCardCode}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
      });
      
      yPosition -= 25;
      
      page.drawText(`Redeemed Amount: $${receiptData.amount.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
      });
      
      yPosition -= 25;
      
      page.drawText(`Remaining Balance: $${receiptData.remainingBalance.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
      });
    } else {
      page.drawText('Gift Card Purchase', {
        x: 50,
        y: yPosition,
        size: 18,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      yPosition -= 40;
      
      page.drawText(`Gift Card Code: ${receiptData.giftCardCode}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
      });
      
      yPosition -= 25;
      
      page.drawText(`Amount: $${receiptData.amount.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
      });
      
      yPosition -= 25;
      
      page.drawText(`Design: ${receiptData.design}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
      });
      
      if (receiptData.customMessage) {
        yPosition -= 25;
        page.drawText(`Message: ${receiptData.customMessage}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
      }
      
      if (receiptData.recipientName) {
        yPosition -= 25;
        page.drawText(`Recipient: ${receiptData.recipientName}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
      }
      
      if (receiptData.senderName) {
        yPosition -= 25;
        page.drawText(`From: ${receiptData.senderName}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
      }
    }
    
    // QR Code (if provided)
    if (qrCodeDataUrl) {
      try {
        // Convert data URL to buffer
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');
        
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        const qrDims = qrImage.scale(0.5);
        
        yPosition -= 60;
        
        page.drawText('QR Code:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBold,
        });
        
        yPosition -= 20;
        
        page.drawImage(qrImage, {
          x: 50,
          y: yPosition - qrDims.height,
          width: qrDims.width,
          height: qrDims.height,
        });
      } catch (error) {
        console.error('Error embedding QR code in PDF:', error);
      }
    }
    
    // Footer
    page.drawText('Thank you for using SiZu GiftCard!', {
      x: 50,
      y: 50,
      size: 12,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    page.drawText('For support, visit our website or contact customer service.', {
      x: 50,
      y: 30,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    return await pdfDoc.save();
  }

  async generateReceiptPDF(receiptData: any, qrCodeDataUrl?: string): Promise<string> {
    try {
      const pdfBuffer = await this.createReceiptPDF(receiptData, qrCodeDataUrl);
      
      // Ensure receipts directory exists
      const receiptsDir = path.join(process.cwd(), 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }
      
      // Generate unique filename
      const filename = `receipt-${receiptData.transactionId || Date.now()}.pdf`;
      const filepath = path.join(receiptsDir, filename);
      
      // Write PDF to file
      fs.writeFileSync(filepath, pdfBuffer);
      
      // Schedule cleanup of old files (older than 30 days)
      this.scheduleCleanup(receiptsDir);
      
      return filepath;
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      throw new Error('Failed to generate PDF receipt');
    }
  }

  private scheduleCleanup(directory: string) {
    setTimeout(() => {
      try {
        const files = fs.readdirSync(directory);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        files.forEach(file => {
          const filepath = path.join(directory, file);
          const stat = fs.statSync(filepath);
          
          if (stat.mtime.getTime() < thirtyDaysAgo) {
            fs.unlinkSync(filepath);
            console.log(`Cleaned up old PDF: ${file}`);
          }
        });
      } catch (error) {
        console.error('Error during PDF cleanup:', error);
      }
    }, 60000); // Run cleanup after 1 minute
  }

  async generateGiftCardPDF(giftCardData: any, qrCodeDataUrl?: string): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      
      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const { width, height } = page.getSize();
      
      // Background gradient (simulated with rectangles)
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(0.46, 0.23, 0.93), // Primary color
      });
      
      // Gift card frame
      page.drawRectangle({
        x: 25,
        y: 25,
        width: width - 50,
        height: height - 50,
        borderColor: rgb(1, 1, 1),
        borderWidth: 2,
      });
      
      // Title
      page.drawText('SiZu GiftCard', {
        x: 50,
        y: height - 80,
        size: 32,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
      
      // Amount
      page.drawText(`$${giftCardData.amount.toFixed(2)}`, {
        x: 50,
        y: height - 130,
        size: 48,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
      
      // Code
      page.drawText(`Code: ${giftCardData.code}`, {
        x: 50,
        y: height - 180,
        size: 14,
        font: helveticaFont,
        color: rgb(1, 1, 1),
      });
      
      // Message
      if (giftCardData.customMessage) {
        page.drawText(`"${giftCardData.customMessage}"`, {
          x: 50,
          y: height - 210,
          size: 12,
          font: helveticaFont,
          color: rgb(1, 1, 1),
        });
      }
      
      // Recipient
      if (giftCardData.recipientName) {
        page.drawText(`To: ${giftCardData.recipientName}`, {
          x: 50,
          y: height - 240,
          size: 12,
          font: helveticaFont,
          color: rgb(1, 1, 1),
        });
      }
      
      // Sender
      if (giftCardData.senderName) {
        page.drawText(`From: ${giftCardData.senderName}`, {
          x: 50,
          y: height - 260,
          size: 12,
          font: helveticaFont,
          color: rgb(1, 1, 1),
        });
      }
      
      // QR Code
      if (qrCodeDataUrl) {
        try {
          const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(base64Data, 'base64');
          
          const qrImage = await pdfDoc.embedPng(qrBuffer);
          const qrDims = qrImage.scale(0.4);
          
          page.drawImage(qrImage, {
            x: width - qrDims.width - 50,
            y: height - qrDims.height - 100,
            width: qrDims.width,
            height: qrDims.height,
          });
        } catch (error) {
          console.error('Error embedding QR code in gift card PDF:', error);
        }
      }
      
      const pdfBuffer = await pdfDoc.save();
      
      // Ensure gift cards directory exists
      const giftsDir = path.join(process.cwd(), 'gift-cards');
      if (!fs.existsSync(giftsDir)) {
        fs.mkdirSync(giftsDir, { recursive: true });
      }
      
      // Generate unique filename
      const filename = `gift-card-${giftCardData.code}.pdf`;
      const filepath = path.join(giftsDir, filename);
      
      // Write PDF to file
      fs.writeFileSync(filepath, pdfBuffer);
      
      return filepath;
    } catch (error) {
      console.error('Error generating gift card PDF:', error);
      throw new Error('Failed to generate gift card PDF');
    }
  }
}
