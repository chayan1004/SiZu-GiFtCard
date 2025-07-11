import formData from 'form-data';
import Mailgun from 'mailgun.js';

export class EmailService {
  private mailgunClient: any;
  private domain: string;
  private fromEmail: string;
  private isConfigured: boolean;

  constructor() {
    // Configure with Mailgun API
    const apiKey = process.env.MAILGUN_API_KEY;
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@sizu-giftcard.com';
    
    if (apiKey && this.domain) {
      const mailgun = new Mailgun(formData);
      this.mailgunClient = mailgun.client({
        username: 'api',
        key: apiKey,
        // Uncomment for EU region:
        // url: 'https://api.eu.mailgun.net'
      });
      this.isConfigured = true;
      console.log('Mailgun API configured successfully');
    } else {
      this.isConfigured = false;
      console.warn('Mailgun API credentials not provided. Emails will be logged to console.');
      console.warn('Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
    }
  }

  async sendGiftCardEmail(
    recipientEmail: string,
    giftCardData: any,
    pdfPath?: string,
    qrCodeDataUrl?: string
  ): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.log('=== GIFT CARD EMAIL (DEV MODE) ===');
        console.log('To:', recipientEmail);
        console.log('Subject: Your SiZu GiftCard is ready!');
        console.log('Gift Card Details:', {
          amount: giftCardData.amount,
          code: giftCardData.giftCardCode,
          design: giftCardData.design,
          recipientName: giftCardData.recipientName,
          senderName: giftCardData.senderName
        });
        console.log('================================');
        return;
      }

      const messageData: any = {
        from: `SiZu GiftCard <${this.fromEmail}>`,
        to: [recipientEmail],
        subject: 'Your SiZu GiftCard is ready!',
        html: this.generateGiftCardEmailHTML(giftCardData, qrCodeDataUrl)
      };

      // Add attachment if PDF path is provided
      if (pdfPath) {
        const fs = require('fs');
        const fileData = await fs.promises.readFile(pdfPath);
        messageData.attachment = [{
          filename: 'gift-card-receipt.pdf',
          data: fileData
        }];
      }

      const response = await this.mailgunClient.messages.create(this.domain, messageData);
      console.log('Gift card email sent:', response.id);
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
      if (!this.isConfigured) {
        console.log('=== REDEMPTION EMAIL (DEV MODE) ===');
        console.log('To:', recipientEmail);
        console.log('Subject: Gift Card Redemption Receipt');
        console.log('Redemption Details:', {
          giftCardCode: redemptionData.giftCardCode,
          amount: redemptionData.amount,
          remainingBalance: redemptionData.remainingBalance,
          transactionId: redemptionData.transactionId
        });
        console.log('===================================');
        return;
      }

      const messageData: any = {
        from: `SiZu GiftCard <${this.fromEmail}>`,
        to: [recipientEmail],
        subject: 'Gift Card Redemption Receipt',
        html: this.generateRedemptionEmailHTML(redemptionData)
      };

      // Add attachment if PDF path is provided
      if (pdfPath) {
        const fs = require('fs');
        const fileData = await fs.promises.readFile(pdfPath);
        messageData.attachment = [{
          filename: 'redemption-receipt.pdf',
          data: fileData
        }];
      }

      const response = await this.mailgunClient.messages.create(this.domain, messageData);
      console.log('Redemption email sent:', response.id);
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
      if (!this.isConfigured) {
        console.log('=== FRAUD ALERT EMAIL (DEV MODE) ===');
        console.log('To:', adminEmail);
        console.log(`Subject: [FRAUD ALERT] ${alertData.alertType} - ${alertData.severity.toUpperCase()}`);
        console.log('Alert Details:', alertData);
        console.log('====================================');
        return;
      }

      const messageData = {
        from: `SiZu GiftCard Security <${this.fromEmail}>`,
        to: [adminEmail],
        subject: `[FRAUD ALERT] ${alertData.alertType} - ${alertData.severity.toUpperCase()}`,
        html: this.generateFraudAlertEmailHTML(alertData)
      };

      const response = await this.mailgunClient.messages.create(this.domain, messageData);
      console.log('Fraud alert email sent:', response.id);
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

  async sendOTPEmail(email: string, otp: string, firstName?: string): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.log('=== OTP EMAIL (DEV MODE) ===');
        console.log('To:', email);
        console.log('Subject: Your SiZu GiftCard Verification Code');
        console.log('OTP Code:', otp);
        console.log('Name:', firstName || 'Not provided');
        console.log('============================');
        return;
      }

      const messageData = {
        from: `SiZu GiftCard <${this.fromEmail}>`,
        to: [email],
        subject: 'Your SiZu GiftCard Verification Code',
        html: this.generateOTPEmailHTML(email, otp, firstName)
      };

      const response = await this.mailgunClient.messages.create(this.domain, messageData);
      console.log('OTP email sent:', response.id);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;
      
      if (!this.isConfigured) {
        console.log('=== PASSWORD RESET EMAIL (DEV MODE) ===');
        console.log('To:', email);
        console.log('Subject: Reset Your SiZu GiftCard Password');
        console.log('Reset URL:', resetUrl);
        console.log('=====================================');
        return;
      }

      const messageData = {
        from: `SiZu GiftCard <${this.fromEmail}>`,
        to: [email],
        subject: 'Reset Your SiZu GiftCard Password',
        html: this.generatePasswordResetEmailHTML(email, resetUrl)
      };

      const response = await this.mailgunClient.messages.create(this.domain, messageData);
      console.log('Password reset email sent:', response.id);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  private generateOTPEmailHTML(email: string, otp: string, firstName?: string): string {
    const name = firstName || 'there';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #7C3AED; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #7C3AED; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 5px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Thank you for registering with SiZu GiftCard! To complete your registration, please enter the verification code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">This code expires in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. SiZu GiftCard staff will never ask for your verification code.
            </div>
            
            <p>If you didn't create an account with us, please ignore this email and the code will expire automatically.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmailHTML(email: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444 0%, #F59E0B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #F59E0B 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hi there,</p>
            
            <p>We received a request to reset the password for your SiZu GiftCard account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #EF4444;">${resetUrl}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <p><strong>Security Tip:</strong> Never share your password with anyone. SiZu GiftCard staff will never ask for your password.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
