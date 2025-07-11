import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure with Mailgun SMTP or fallback to console logging
    const mailgunUser = process.env.MAILGUN_SMTP_LOGIN;
    const mailgunPassword = process.env.MAILGUN_SMTP_PASSWORD;
    const mailgunHost = process.env.MAILGUN_SMTP_SERVER || 'smtp.mailgun.org';
    const mailgunPort = parseInt(process.env.MAILGUN_SMTP_PORT || '587');

    if (mailgunUser && mailgunPassword) {
      this.transporter = nodemailer.createTransport({
        host: mailgunHost,
        port: mailgunPort,
        secure: false, // true for 465, false for other ports
        auth: {
          user: mailgunUser,
          pass: mailgunPassword,
        },
      });
    } else {
      // Fallback to console logging for development
      console.warn('Mailgun credentials not provided. Emails will be logged to console.');
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  async sendGiftCardEmail(
    recipientEmail: string,
    giftCardData: any,
    pdfPath?: string,
    qrCodeDataUrl?: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@sizu-giftcard.com',
        to: recipientEmail,
        subject: 'Your SiZu GiftCard is ready!',
        html: this.generateGiftCardEmailHTML(giftCardData, qrCodeDataUrl),
        attachments: pdfPath ? [
          {
            filename: 'gift-card-receipt.pdf',
            path: pdfPath,
            contentType: 'application/pdf',
          },
        ] : [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Gift card email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending gift card email:', error);
      throw new Error('Failed to send gift card email');
    }
  }

  async sendRedemptionEmail(
    recipientEmail: string,
    redemptionData: any,
    pdfPath?: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@sizu-giftcard.com',
        to: recipientEmail,
        subject: 'Gift Card Redemption Receipt',
        html: this.generateRedemptionEmailHTML(redemptionData),
        attachments: pdfPath ? [
          {
            filename: 'redemption-receipt.pdf',
            path: pdfPath,
            contentType: 'application/pdf',
          },
        ] : [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Redemption email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending redemption email:', error);
      throw new Error('Failed to send redemption email');
    }
  }

  async sendFraudAlertEmail(
    adminEmail: string,
    alertData: any
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@sizu-giftcard.com',
        to: adminEmail,
        subject: `[FRAUD ALERT] ${alertData.alertType} - ${alertData.severity.toUpperCase()}`,
        html: this.generateFraudAlertEmailHTML(alertData),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Fraud alert email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending fraud alert email:', error);
      throw new Error('Failed to send fraud alert email');
    }
  }

  private generateGiftCardEmailHTML(giftCardData: any, qrCodeDataUrl?: string): string {
    const qrCodeImg = qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: 150px; margin: 20px 0;">` : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your SiZu GiftCard</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .gift-card { background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .amount { font-size: 48px; font-weight: bold; margin: 20px 0; }
          .code { font-size: 18px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Your SiZu GiftCard is Ready!</h1>
          </div>
          
          <div class="content">
            ${giftCardData.recipientName ? `<p>Hi ${giftCardData.recipientName},</p>` : '<p>Hi there,</p>'}
            
            ${giftCardData.senderName ? `<p>You've received a gift card from <strong>${giftCardData.senderName}</strong>!</p>` : '<p>You\'ve received a gift card!</p>'}
            
            ${giftCardData.customMessage ? `<p><em>"${giftCardData.customMessage}"</em></p>` : ''}
            
            <div class="gift-card">
              <h2>SiZu GiftCard</h2>
              <div class="amount">$${giftCardData.amount.toFixed(2)}</div>
              <div class="code">Code: ${giftCardData.giftCardCode}</div>
              <p>Design: ${giftCardData.design}</p>
            </div>
            
            <p>You can redeem this gift card by:</p>
            <ul>
              <li>Visiting our website and entering the code above</li>
              <li>Scanning the QR code below with your phone</li>
            </ul>
            
            ${qrCodeImg}
            
            <p>Your gift card receipt is attached to this email. Keep it safe!</p>
            
            <p>Thank you for choosing SiZu GiftCard!</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by SiZu GiftCard. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateRedemptionEmailHTML(redemptionData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gift Card Redemption Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .receipt { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #10B981; }
          .amount { font-size: 24px; font-weight: bold; color: #10B981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Gift Card Redeemed Successfully!</h1>
          </div>
          
          <div class="content">
            <p>Your gift card has been successfully redeemed. Here are the details:</p>
            
            <div class="receipt">
              <h3>Redemption Receipt</h3>
              <p><strong>Gift Card Code:</strong> ${redemptionData.giftCardCode}</p>
              <p><strong>Redeemed Amount:</strong> <span class="amount">$${redemptionData.amount.toFixed(2)}</span></p>
              <p><strong>Remaining Balance:</strong> $${redemptionData.remainingBalance.toFixed(2)}</p>
              <p><strong>Transaction ID:</strong> ${redemptionData.transactionId}</p>
              <p><strong>Date:</strong> ${new Date(redemptionData.timestamp).toLocaleString()}</p>
            </div>
            
            <p>A detailed receipt is attached to this email for your records.</p>
            
            <p>Thank you for using SiZu GiftCard!</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by SiZu GiftCard. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateFraudAlertEmailHTML(alertData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fraud Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #FEE2E2; border: 2px solid #EF4444; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .severity { font-weight: bold; text-transform: uppercase; }
          .severity.high { color: #EF4444; }
          .severity.medium { color: #F59E0B; }
          .severity.low { color: #10B981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Fraud Alert</h1>
          </div>
          
          <div class="content">
            <div class="alert">
              <h3>Alert Details</h3>
              <p><strong>Type:</strong> ${alertData.alertType}</p>
              <p><strong>Severity:</strong> <span class="severity ${alertData.severity}">${alertData.severity}</span></p>
              <p><strong>Description:</strong> ${alertData.description}</p>
              ${alertData.giftCardId ? `<p><strong>Gift Card ID:</strong> ${alertData.giftCardId}</p>` : ''}
              <p><strong>Time:</strong> ${new Date(alertData.createdAt).toLocaleString()}</p>
            </div>
            
            ${alertData.metadata ? `<pre>${JSON.stringify(alertData.metadata, null, 2)}</pre>` : ''}
            
            <p>Please review this alert and take appropriate action if necessary.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated alert from SiZu GiftCard fraud detection system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
