import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // For customer accounts only
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // 'admin' or 'user' or 'customer'
  squareCustomerId: varchar("square_customer_id").unique(), // Square Customer ID for saved cards
  isEmailVerified: boolean("is_email_verified").default(false),
  verificationOtp: varchar("verification_otp", { length: 6 }), // 6-digit OTP
  otpExpiry: timestamp("otp_expiry", { withTimezone: true, mode: 'date' }),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true, mode: 'date' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saved Cards table - stores Square card references only
export const savedCards = pgTable("saved_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  squareCardId: varchar("square_card_id").notNull(), // Square's card ID
  cardBrand: varchar("card_brand").notNull(), // VISA, MASTERCARD, etc.
  last4: varchar("last4", { length: 4 }).notNull(), // Last 4 digits only
  expMonth: integer("exp_month").notNull(), // Expiration month
  expYear: integer("exp_year").notNull(), // Expiration year
  cardholderName: varchar("cardholder_name"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gift Cards table
export const giftCards = pgTable("gift_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  squareGiftCardId: varchar("square_gift_card_id").unique(),
  code: varchar("code").unique().notNull(),
  initialAmount: decimal("initial_amount", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull(),
  design: varchar("design").default("classic").notNull(),
  customMessage: text("custom_message"),
  recipientEmail: varchar("recipient_email"),
  recipientName: varchar("recipient_name"),
  senderName: varchar("sender_name"),
  deliveryStatus: varchar("delivery_status").default("pending").notNull(), // 'pending', 'sent', 'delivered', 'failed'
  isActive: boolean("is_active").default(true).notNull(),
  issuedById: varchar("issued_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_gift_cards_issued_by").on(table.issuedById),
  index("idx_gift_cards_created_at").on(table.createdAt),
]);

// Gift Card Transactions table
export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftCardId: uuid("gift_card_id").references(() => giftCards.id).notNull(),
  type: varchar("type").notNull(), // 'issue', 'redeem', 'refund'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  squareTransactionId: varchar("square_transaction_id"),
  paymentMethodLast4: varchar("payment_method_last4", { length: 4 }), // Last 4 digits of payment method
  paymentMethodType: varchar("payment_method_type"), // 'VISA', 'MASTERCARD', 'AMEX', etc.
  notes: text("notes"),
  performedById: varchar("performed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipts table
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftCardId: uuid("gift_card_id").references(() => giftCards.id).notNull(),
  transactionId: uuid("transaction_id").references(() => giftCardTransactions.id).notNull(),
  receiptData: jsonb("receipt_data").notNull(),
  pdfPath: varchar("pdf_path"),
  emailSent: boolean("email_sent").default(false),
  accessToken: varchar("access_token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fee Configuration table
export const feeConfigurations = pgTable("fee_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  feeType: varchar("fee_type", { length: 100 }).notNull().unique(), // e.g., "standard", "premium", "rush", "corporate"
  feeName: varchar("fee_name", { length: 255 }).notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  isPercentage: boolean("is_percentage").notNull().default(false),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }), // User ID who last updated
});

// Fraud Alerts table
export const fraudAlerts = pgTable("fraud_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftCardId: uuid("gift_card_id").references(() => giftCards.id),
  alertType: varchar("alert_type").notNull(), // 'suspicious_activity', 'multiple_attempts', 'high_velocity'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high'
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  resolved: boolean("resolved").default(false),
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Merchant Connections table (for Square OAuth)
export const merchantConnections = pgTable("merchant_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  merchantId: varchar("merchant_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Links table
export const paymentLinks = pgTable("payment_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  squarePaymentLinkId: varchar("square_payment_link_id").unique(),
  version: integer("version"),
  url: text("url").notNull(),
  orderId: varchar("order_id"),
  checkoutOptions: jsonb("checkout_options"),
  prePopulatedData: jsonb("pre_populated_data"),
  paymentNote: text("payment_note"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Refunds table
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  squareRefundId: varchar("square_refund_id").unique(),
  paymentId: varchar("payment_id"),
  orderId: varchar("order_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  reason: text("reason"),
  status: varchar("status").notNull(), // 'PENDING', 'COMPLETED', 'FAILED'
  processedById: varchar("processed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disputes table
export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  squareDisputeId: varchar("square_dispute_id").unique(),
  paymentId: varchar("payment_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  state: varchar("state").notNull(), // 'INQUIRY_EVIDENCE_REQUIRED', 'PROCESSING', 'WON', 'LOST', etc.
  reason: varchar("reason"),
  dueAt: timestamp("due_at"),
  evidenceIds: text("evidence_ids").array(),
  cardBrand: varchar("card_brand"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook Subscriptions table
export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  squareSubscriptionId: varchar("square_subscription_id").unique(),
  name: varchar("name").notNull(),
  eventTypes: text("event_types").array(),
  notificationUrl: text("notification_url").notNull(),
  apiVersion: varchar("api_version"),
  signatureKey: text("signature_key"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates table
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull().unique(),
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: jsonb("variables"), // Available template variables
  category: varchar("category"), // 'transactional', 'marketing', etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gift Card Designs table
export const giftCardDesigns = pgTable("gift_card_designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  category: varchar("category"), // 'birthday', 'holiday', 'thank_you', etc.
  designConfig: jsonb("design_config").notNull(), // Colors, patterns, images, etc.
  previewUrl: text("preview_url"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  resource: varchar("resource").notNull(), // 'gift_card', 'user', 'payment', etc.
  resourceId: varchar("resource_id"),
  changes: jsonb("changes"), // Before/after values
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings table
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category").notNull(), // 'general', 'payment', 'email', etc.
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(), // Can be exposed to frontend
  updatedById: varchar("updated_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Square Payments table - track all payment records
export const squarePayments = pgTable("square_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  squarePaymentId: varchar("square_payment_id").unique(),
  orderId: varchar("order_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: varchar("status").notNull(), // APPROVED, COMPLETED, CANCELED, FAILED
  sourceType: varchar("source_type"), // CARD, BANK_ACCOUNT, WALLET, etc.
  cardBrand: varchar("card_brand"),
  last4: varchar("last4", { length: 4 }),
  receiptUrl: text("receipt_url"),
  userId: varchar("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_square_payments_user").on(table.userId),
  index("idx_square_payments_order").on(table.orderId),
  index("idx_square_payments_created_at").on(table.createdAt),
]);

// Webhook Events table - log all webhook events
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: varchar("event_id").unique(),
  eventType: varchar("event_type").notNull(),
  merchantId: varchar("merchant_id"),
  locationId: varchar("location_id"),
  entityId: varchar("entity_id"), // ID of the affected entity (payment, order, etc.)
  eventData: jsonb("event_data").notNull(),
  processed: boolean("processed").default(false).notNull(),
  processingError: text("processing_error"),
  signature: text("signature"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("idx_webhook_events_type").on(table.eventType),
  index("idx_webhook_events_entity").on(table.entityId),
  index("idx_webhook_events_processed").on(table.processed),
  index("idx_webhook_events_created_at").on(table.createdAt),
]);

// OAuth States table - temporary storage for OAuth flow states
export const oauthStates = pgTable("oauth_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  state: varchar("state").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  redirectUri: text("redirect_uri"),
  scopes: text("scopes").array(),
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_oauth_states_state").on(table.state),
  index("idx_oauth_states_expires_at").on(table.expiresAt),
  index("idx_oauth_states_user").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  issuedGiftCards: many(giftCards),
  transactions: many(giftCardTransactions),
  resolvedAlerts: many(fraudAlerts),
  savedCards: many(savedCards),
}));

export const savedCardsRelations = relations(savedCards, ({ one }) => ({
  user: one(users, {
    fields: [savedCards.userId],
    references: [users.id],
  }),
}));

export const giftCardsRelations = relations(giftCards, ({ one, many }) => ({
  issuedBy: one(users, {
    fields: [giftCards.issuedById],
    references: [users.id],
  }),
  transactions: many(giftCardTransactions),
  receipts: many(receipts),
  fraudAlerts: many(fraudAlerts),
}));

export const giftCardTransactionsRelations = relations(giftCardTransactions, ({ one, many }) => ({
  giftCard: one(giftCards, {
    fields: [giftCardTransactions.giftCardId],
    references: [giftCards.id],
  }),
  performedBy: one(users, {
    fields: [giftCardTransactions.performedById],
    references: [users.id],
  }),
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  giftCard: one(giftCards, {
    fields: [receipts.giftCardId],
    references: [giftCards.id],
  }),
  transaction: one(giftCardTransactions, {
    fields: [receipts.transactionId],
    references: [giftCardTransactions.id],
  }),
}));

export const fraudAlertsRelations = relations(fraudAlerts, ({ one }) => ({
  giftCard: one(giftCards, {
    fields: [fraudAlerts.giftCardId],
    references: [giftCards.id],
  }),
  resolvedBy: one(users, {
    fields: [fraudAlerts.resolvedById],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertGiftCardSchema = createInsertSchema(giftCards).pick({
  initialAmount: true,
  design: true,
  customMessage: true,
  recipientEmail: true,
  recipientName: true,
  senderName: true,
  deliveryStatus: true,
});

export const insertGiftCardTransactionSchema = createInsertSchema(giftCardTransactions).pick({
  giftCardId: true,
  type: true,
  amount: true,
  paymentMethodLast4: true,
  paymentMethodType: true,
  notes: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).pick({
  giftCardId: true,
  transactionId: true,
  receiptData: true,
});

export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).pick({
  giftCardId: true,
  alertType: true,
  severity: true,
  description: true,
  metadata: true,
});

export const insertSavedCardSchema = createInsertSchema(savedCards).pick({
  userId: true,
  squareCardId: true,
  cardBrand: true,
  last4: true,
  expMonth: true,
  expYear: true,
  cardholderName: true,
  isDefault: true,
});

export const insertFeeConfigurationSchema = createInsertSchema(feeConfigurations).pick({
  feeType: true,
  feeName: true,
  feeAmount: true,
  isPercentage: true,
  minAmount: true,
  maxAmount: true,
  isActive: true,
  description: true,
  updatedBy: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCard = typeof giftCards.$inferSelect;

export type InsertGiftCardTransaction = z.infer<typeof insertGiftCardTransactionSchema>;
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;
export type FraudAlert = typeof fraudAlerts.$inferSelect;

export type InsertSavedCard = z.infer<typeof insertSavedCardSchema>;
export type SavedCard = typeof savedCards.$inferSelect;

export type InsertFeeConfiguration = z.infer<typeof insertFeeConfigurationSchema>;
export type FeeConfiguration = typeof feeConfigurations.$inferSelect;

// Additional type exports for new tables
export type MerchantConnection = typeof merchantConnections.$inferSelect;
export type InsertMerchantConnection = typeof merchantConnections.$inferInsert;

export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = typeof paymentLinks.$inferInsert;

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = typeof refunds.$inferInsert;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = typeof webhookSubscriptions.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type GiftCardDesign = typeof giftCardDesigns.$inferSelect;
export type InsertGiftCardDesign = typeof giftCardDesigns.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

export type SquarePayment = typeof squarePayments.$inferSelect;
export type InsertSquarePayment = typeof squarePayments.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

export type OAuthState = typeof oauthStates.$inferSelect;
export type InsertOAuthState = typeof oauthStates.$inferInsert;

// Rate Limiting table (for API and WebSocket rate limiting)
export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier").notNull(), // IP address or user ID
  endpoint: varchar("endpoint").notNull(),
  count: integer("count").default(0).notNull(),
  windowStart: timestamp("window_start").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rate_limits_identifier").on(table.identifier),
  index("idx_rate_limits_window").on(table.windowStart),
]);

export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = typeof rateLimits.$inferInsert;

// Additional validation schemas
export const redeemGiftCardSchema = z.object({
  code: z.string().min(1, "Gift card code is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

export const checkBalanceSchema = z.object({
  code: z.string().min(1, "Gift card code is required"),
});

export const createGiftCardSchema = insertGiftCardSchema.extend({
  initialAmount: z.coerce.number().min(1, "Amount must be at least $1").max(500, "Amount cannot exceed $500"),
  design: z.enum(["classic", "love", "premium"]).default("classic"),
  customMessage: z.string().max(500, "Message too long").optional(),
  recipientEmail: z.string().email("Invalid email address").optional(),
  recipientName: z.string().max(100, "Name too long").optional(),
  senderName: z.string().max(100, "Name too long").optional(),
});

export type RedeemGiftCardInput = z.infer<typeof redeemGiftCardSchema>;
export type CheckBalanceInput = z.infer<typeof checkBalanceSchema>;
export type CreateGiftCardInput = z.infer<typeof createGiftCardSchema>;

// Saved Card validation schemas
export const addSavedCardSchema = z.object({
  nonce: z.string().min(1, "Payment nonce is required"), // Square payment token
  verification_token: z.string().optional(), // For 3DS verification
});

export const deleteSavedCardSchema = z.object({
  cardId: z.string().uuid("Invalid card ID"),
});

export const setSavedCardDefaultSchema = z.object({
  cardId: z.string().uuid("Invalid card ID"),
});

export type AddSavedCardInput = z.infer<typeof addSavedCardSchema>;
export type DeleteSavedCardInput = z.infer<typeof deleteSavedCardSchema>;
export type SetSavedCardDefaultInput = z.infer<typeof setSavedCardDefaultSchema>;

// Order History types
export interface OrderHistoryItem {
  id: string;
  code: string;
  amount: string;
  recipientName?: string;
  recipientEmail?: string;
  senderName?: string;
  design: string;
  deliveryStatus: string;
  paymentMethodLast4?: string;
  paymentMethodType?: string;
  createdAt: Date;
  isRedeemed: boolean;
  redeemedAmount?: string;
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
