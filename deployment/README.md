# SiZu GiftCard Platform - Deployment Guide

## Overview
Complete deployment guide for the SiZu GiftCard Platform with comprehensive testing and production configuration.

## Prerequisites

### Environment Variables
Set these environment variables before deployment:

#### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (32+ characters)
- `REPLIT_DOMAINS` - Comma-separated list of allowed domains

#### Square Integration (Optional)
- `SQUARE_ACCESS_TOKEN` - Square API access token
- `SQUARE_LOCATION_ID` - Square location ID
- `SQUARE_ENVIRONMENT` - Set to "production" for live, "sandbox" for testing

#### Email Configuration (Optional)
- `MAILGUN_SMTP_HOST` - SMTP server hostname
- `MAILGUN_SMTP_PORT` - SMTP port (587 recommended)
- `MAILGUN_SMTP_USER` - SMTP username
- `MAILGUN_SMTP_PASS` - SMTP password
- `FROM_EMAIL` - Default sender email

#### Feature Flags
- `ENABLE_SQUARE` - Enable Square integration (true/false)
- `ENABLE_EMAIL` - Enable email notifications (true/false)
- `ENABLE_FRAUD_DETECTION` - Enable fraud detection (true/false)
- `ENABLE_ANALYTICS` - Enable analytics tracking (true/false)

## Testing

### Backend Unit Tests
```bash
# Run all backend tests
npx vitest run

# Run tests with coverage
npx vitest run --coverage

# Run tests in watch mode
npx vitest

# Run specific test file
npx vitest run server/tests/giftcards.test.ts
```

### Frontend E2E Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run E2E tests in debug mode
npx playwright test --debug
```

### Security Tests
```bash
# Run security-specific tests
npx vitest run server/tests/security.test.ts

# Run integration tests
npx vitest run server/tests/integration.test.ts
```

## Deployment Options

### Option 1: Replit Deployment

1. **Set Environment Variables**
   ```bash
   # Set in Replit Secrets
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-secret-key
   REPLIT_DOMAINS=your-domain.replit.app
   SQUARE_ACCESS_TOKEN=your-square-token
   SQUARE_LOCATION_ID=your-location-id
   ```

2. **Deploy**
   ```bash
   npm run build
   npm run start
   ```

### Option 2: Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   cd deployment/docker
   docker-compose up -d
   ```

2. **Environment Configuration**
   Create `.env` file in deployment/docker/:
   ```env
   DATABASE_URL=postgresql://sizu:password@db:5432/sizu_giftcards
   SESSION_SECRET=your-32-character-secret-key
   REPLIT_DOMAINS=your-domain.com
   SQUARE_ACCESS_TOKEN=your-square-token
   SQUARE_LOCATION_ID=your-location-id
   POSTGRES_PASSWORD=secure-db-password
   ```

### Option 3: Manual Deployment

1. **Install Dependencies**
   ```bash
   npm ci --only=production
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Database Setup**
   ```bash
   npm run db:push
   ```

4. **Start Application**
   ```bash
   npm run start
   ```

## Production Checklist

### Security
- [ ] HTTPS enabled and configured
- [ ] Security headers implemented
- [ ] Rate limiting active
- [ ] Input validation enabled
- [ ] CORS configured properly
- [ ] Session secrets secured
- [ ] Square API keys secured

### Performance
- [ ] Database connection pooling
- [ ] Static file caching
- [ ] Compression enabled
- [ ] CDN configured (if needed)

### Monitoring
- [ ] Health check endpoint responding
- [ ] Logs configured and accessible
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### Functionality
- [ ] All API endpoints responding
- [ ] Authentication working
- [ ] Gift card creation working
- [ ] Gift card redemption working
- [ ] Balance checking working
- [ ] Email notifications working (if enabled)
- [ ] PDF generation working
- [ ] QR code generation working

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Login redirect
- `GET /api/logout` - Logout and redirect

### Gift Cards
- `POST /api/giftcards` - Create gift card (Admin only)
- `POST /api/giftcards/balance` - Check balance (Public)
- `POST /api/giftcards/redeem` - Redeem gift card (Public)
- `GET /api/giftcards/mine` - Get user's gift cards
- `GET /api/giftcards/:id` - Get specific gift card

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/giftcards` - All gift cards
- `GET /api/admin/transactions` - All transactions
- `GET /api/admin/fraud-alerts` - Fraud alerts

### Receipts
- `GET /api/receipts/:token` - Get receipt by token

### Health Check
- `GET /health` - Application health status

## Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Gift card operations: 10 requests per minute

### Input Validation
- SQL injection protection
- XSS prevention
- Email format validation
- Gift card amount validation (min: $1, max: $10,000)

### Security Headers
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HTTPS only)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database server is running
   - Ensure firewall allows connections

2. **Square API Errors**
   - Verify `SQUARE_ACCESS_TOKEN` is valid
   - Check `SQUARE_LOCATION_ID` is correct
   - Ensure Square account is active

3. **Email Delivery Issues**
   - Check SMTP credentials
   - Verify email server settings
   - Check spam folder for test emails

4. **Authentication Problems**
   - Verify `SESSION_SECRET` is set
   - Check `REPLIT_DOMAINS` matches your domain
   - Ensure HTTPS is enabled in production

### Logs
Application logs are available in:
- Console output (development)
- `/app/logs/app.log` (production Docker)
- Replit logs (Replit deployment)

### Health Check
Monitor application health at `/health` endpoint:
```bash
curl https://your-domain.com/health
```

## Performance Optimization

### Database
- Connection pooling configured
- Indexes on frequently queried columns
- Regular maintenance and backups

### Caching
- Static assets cached for 1 year
- API responses cached where appropriate
- Browser caching headers set

### CDN (Optional)
Consider using a CDN for static assets:
- Images and icons
- CSS and JavaScript files
- PDF receipts (if public)

## Backup Strategy

### Database Backups
```bash
# Daily automated backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Weekly full backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Application Backups
- Source code in version control
- Environment variables documented
- Configuration files backed up

## Support

For deployment issues or questions:
1. Check the logs for specific error messages
2. Verify all environment variables are set
3. Test endpoints manually with curl or Postman
4. Check the troubleshooting section above

## Updates

To update the application:
1. Pull latest changes from repository
2. Run tests to ensure compatibility
3. Build and deploy new version
4. Monitor logs for any issues

Remember to test thoroughly in a staging environment before deploying to production.