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
  last4: varchar("last_4", { length: 4 }).notNull(), // Last 4 digits only
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
