import QRCode from 'qrcode';

export class QRService {
  async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      
      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  async generateQRCodeSVG(data: string): Promise<string> {
    try {
      const qrCodeSVG = await QRCode.toString(data, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      
      return qrCodeSVG;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  parseQRCodeData(qrData: string): { type: string; data: any } | null {
    try {
      // Check if it's a gift card redemption URL
      if (qrData.includes('/redeem?code=')) {
        const urlParams = new URLSearchParams(qrData.split('?')[1]);
        const code = urlParams.get('code');
        
        if (code) {
          return {
            type: 'redeem',
            data: { code }
          };
        }
      }
      
      // Check if it's a receipt URL
      if (qrData.includes('/receipt/')) {
        const token = qrData.split('/receipt/')[1];
        
        if (token) {
          return {
            type: 'receipt',
            data: { token }
          };
        }
      }
      
      // Check if it's a direct gift card code
      if (qrData.startsWith('GC') && qrData.length >= 10) {
        return {
          type: 'gift_card_code',
          data: { code: qrData }
        };
      }
      
      // Try to parse as JSON
      const jsonData = JSON.parse(qrData);
      return {
        type: 'json',
        data: jsonData
      };
    } catch (error) {
      // If all parsing attempts fail, return the raw data
      return {
        type: 'raw',
        data: { raw: qrData }
      };
    }
  }

  generateRedemptionQRData(code: string, baseUrl: string): string {
    return `${baseUrl}/redeem?code=${code}`;
  }

  generateReceiptQRData(token: string, baseUrl: string): string {
    return `${baseUrl}/receipt/${token}`;
  }

  generateBalanceCheckQRData(code: string, baseUrl: string): string {
    return `${baseUrl}/balance?code=${code}`;
  }

  generateGiftCardQRData(giftCardData: any): string {
    return JSON.stringify({
      type: 'gift_card',
      code: giftCardData.code,
      amount: giftCardData.amount,
      design: giftCardData.design,
      message: giftCardData.customMessage,
      created: new Date().toISOString(),
    });
  }
}
