import {
  users,
  giftCards,
  giftCardTransactions,
  receipts,
  fraudAlerts,
  savedCards,
  feeConfigurations,
  merchantConnections,
  squarePayments,
  oauthStates,
  rateLimits,
  webhookEvents,
  webhookSubscriptions,
  emailTemplates,
  giftCardDesigns,
  auditLogs,
  systemSettings,
  refunds,
  disputes,
  type User,
  type UpsertUser,
  type GiftCard,
  type InsertGiftCard,
  type GiftCardTransaction,
  type InsertGiftCardTransaction,
  type Receipt,
  type InsertReceipt,
  type FraudAlert,
  type InsertFraudAlert,
  type SavedCard,
  type InsertSavedCard,
  type FeeConfiguration,
  type InsertFeeConfiguration,
  type MerchantConnection,
  type InsertMerchantConnection,
  type SquarePayment,
  type InsertSquarePayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Customer authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User>;

  // Gift Card operations
  createGiftCard(giftCard: InsertGiftCard & { code: string }): Promise<GiftCard>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  getGiftCardById(id: string): Promise<GiftCard | undefined>;
  updateGiftCardBalance(id: string, newBalance: string): Promise<GiftCard>;
  updateGiftCardSquareId(id: string, squareGiftCardId: string): Promise<GiftCard>;
  getAllGiftCards(): Promise<GiftCard[]>;
  getGiftCardsByUser(userId: string): Promise<GiftCard[]>;

  // Transaction operations
  createTransaction(transaction: InsertGiftCardTransaction & { balanceAfter: string }): Promise<GiftCardTransaction>;
  getTransactionsByGiftCard(giftCardId: string): Promise<GiftCardTransaction[]>;
  getAllTransactions(): Promise<GiftCardTransaction[]>;
  getRecentTransactions(limit: number): Promise<GiftCardTransaction[]>;

  // Receipt operations
  createReceipt(receipt: InsertReceipt & { accessToken: string; expiresAt: Date }): Promise<Receipt>;
  getReceiptByToken(accessToken: string): Promise<Receipt | undefined>;
  updateReceiptPdfPath(id: string, pdfPath: string): Promise<Receipt>;
  markReceiptEmailSent(id: string): Promise<Receipt>;

  // Fraud Alert operations
  createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert>;
  getFraudAlerts(): Promise<FraudAlert[]>;
  getUnresolvedFraudAlerts(): Promise<FraudAlert[]>;
  resolveFraudAlert(id: string, resolvedById: string): Promise<FraudAlert>;

  // Analytics operations
  getTotalSales(): Promise<{ total: number; count: number }>;
  getTotalRedemptions(): Promise<{ total: number; count: number }>;
  getActiveBalance(): Promise<number>;
  getDashboardStats(): Promise<{
    totalSales: number;
    totalRedemptions: number;
    activeBalance: number;
    cardsIssued: number;
    redemptionsCount: number;
  }>;

  // Saved Card operations
  updateUserSquareCustomerId(userId: string, squareCustomerId: string): Promise<User>;
  addSavedCard(card: InsertSavedCard): Promise<SavedCard>;
  getUserSavedCards(userId: string): Promise<SavedCard[]>;
  getSavedCardById(cardId: string, userId: string): Promise<SavedCard | undefined>;
  deleteSavedCard(cardId: string, userId: string): Promise<void>;
  setDefaultCard(cardId: string, userId: string): Promise<void>;
  getDefaultCard(userId: string): Promise<SavedCard | undefined>;

  // Order History operations
  getUserOrders(userId: string, page: number, pageSize: number): Promise<{
    orders: any[];
    totalCount: number;
  }>;
  getUserOrderDetails(userId: string, orderId: string): Promise<any | undefined>;

  // Revenue tracking operations
  getGiftCardRevenue(giftCardId: string): Promise<{ totalRedeemed: number; redemptionCount: number }>;
  getUserTotalSpending(email: string): Promise<{ totalSpent: number; purchaseCount: number }>;

  // Fee Configuration operations
  getFeeConfigurations(): Promise<FeeConfiguration[]>;
  getFeeByType(feeType: string): Promise<FeeConfiguration | undefined>;
  createFeeConfiguration(fee: InsertFeeConfiguration): Promise<FeeConfiguration>;
  updateFeeConfiguration(id: string, fee: Partial<InsertFeeConfiguration>): Promise<FeeConfiguration>;
  deleteFeeConfiguration(id: string): Promise<void>;
  calculateFeeAmount(cardAmount: number, feeType: string): Promise<number>;

  // Payment record operations (for webhook processing)
  createPaymentRecord(payment: any): Promise<any>;
  updateTransactionStatus(orderId: string, status: string): Promise<void>;

  // Merchant connection operations (for OAuth)
  createMerchantConnection(connection: any): Promise<any>;
  getMerchantConnection(userId: string, merchantId: string): Promise<any | undefined>;
  getMerchantConnections(userId: string): Promise<any[]>;
  updateMerchantConnection(id: string, updates: any): Promise<any>;
  deleteMerchantConnection(id: string): Promise<void>;
  
  // OAuth state operations
  createOAuthState(state: string, userId: string, expiresAt: Date): Promise<void>;
  getOAuthState(state: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deleteOAuthState(state: string): Promise<void>;
  cleanupExpiredOAuthStates(): Promise<void>;
  
  // Rate limiting operations
  checkRateLimit(identifier: string, endpoint: string, windowMs: number, maxRequests: number): Promise<boolean>;
  incrementRateLimit(identifier: string, endpoint: string): Promise<void>;
  cleanupExpiredRateLimits(): Promise<void>;
  
  // Webhook event operations
  createWebhookEvent(event: any): Promise<void>;
  getWebhookEvents(limit?: number): Promise<any[]>;
  
  // Webhook subscription operations
  createWebhookSubscription(subscription: any): Promise<void>;
  updateWebhookSubscription(id: string, updates: any): Promise<void>;
  deleteWebhookSubscription(id: string): Promise<void>;
  getWebhookSubscriptions(): Promise<any[]>;
  
  // Additional missing operations
  createEmailTemplate(template: any): Promise<any>;
  updateEmailTemplate(id: string, updates: any): Promise<any>;
  getEmailTemplates(): Promise<any[]>;
  getEmailTemplate(id: string): Promise<any | undefined>;
  deleteEmailTemplate(id: string): Promise<void>;
  
  createGiftCardDesign(design: any): Promise<any>;
  updateGiftCardDesign(id: string, updates: any): Promise<any>;
  getGiftCardDesigns(): Promise<any[]>;
  getGiftCardDesign(id: string): Promise<any | undefined>;
  deleteGiftCardDesign(id: string): Promise<void>;
  
  createAuditLog(log: any): Promise<void>;
  getAuditLogs(limit?: number, filters?: any): Promise<any[]>;
  
  getSystemSetting(key: string): Promise<any | undefined>;
  setSystemSetting(key: string, value: any): Promise<void>;
  
  createRefund(refund: any): Promise<any>;
  getRefunds(): Promise<any[]>;
  getRefund(id: string): Promise<any | undefined>;
  
  createDispute(dispute: any): Promise<any>;
  getDisputes(): Promise<any[]>;
  getDispute(id: string): Promise<any | undefined>;
  updateDispute(id: string, updates: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser & { id: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer authentication operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: userData.role || 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationOtp, token));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Gift Card operations
  async createGiftCard(giftCard: InsertGiftCard & { code: string }): Promise<GiftCard> {
    const [card] = await db
      .insert(giftCards)
      .values({
        ...giftCard,
        currentBalance: giftCard.initialAmount,
      })
      .returning();
    return card;
  }

  async getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
    const [card] = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.code, code));
    return card;
  }

  async getGiftCardById(id: string): Promise<GiftCard | undefined> {
    const [card] = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.id, id));
    return card;
  }

  async updateGiftCardBalance(id: string, newBalance: string): Promise<GiftCard> {
    const [card] = await db
      .update(giftCards)
      .set({
        currentBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, id))
      .returning();
    return card;
  }

  async updateGiftCardSquareId(id: string, squareGiftCardId: string): Promise<GiftCard> {
    const [card] = await db
      .update(giftCards)
      .set({
        squareGiftCardId,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, id))
      .returning();
    return card;
  }

  async getAllGiftCards(): Promise<GiftCard[]> {
    return await db
      .select()
      .from(giftCards)
      .orderBy(desc(giftCards.createdAt));
  }

  async getGiftCardsByUser(userId: string): Promise<GiftCard[]> {
    return await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.issuedById, userId))
      .orderBy(desc(giftCards.createdAt));
  }

  // Transaction operations
  async createTransaction(transaction: InsertGiftCardTransaction & { balanceAfter: string }): Promise<GiftCardTransaction> {
    const [txn] = await db
      .insert(giftCardTransactions)
      .values(transaction)
      .returning();
    return txn;
  }

  async getTransactionsByGiftCard(giftCardId: string): Promise<GiftCardTransaction[]> {
    return await db
      .select()
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.giftCardId, giftCardId))
      .orderBy(desc(giftCardTransactions.createdAt));
  }

  async getAllTransactions(): Promise<GiftCardTransaction[]> {
    return await db
      .select()
      .from(giftCardTransactions)
      .orderBy(desc(giftCardTransactions.createdAt));
  }

  async getRecentTransactions(limit: number): Promise<GiftCardTransaction[]> {
    return await db
      .select()
      .from(giftCardTransactions)
      .orderBy(desc(giftCardTransactions.createdAt))
      .limit(limit);
  }

  // Receipt operations
  async createReceipt(receipt: InsertReceipt & { accessToken: string; expiresAt: Date }): Promise<Receipt> {
    const [rec] = await db
      .insert(receipts)
      .values(receipt)
      .returning();
    return rec;
  }

  async getReceiptByToken(accessToken: string): Promise<Receipt | undefined> {
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(and(
        eq(receipts.accessToken, accessToken),
        gte(receipts.expiresAt, new Date())
      ));
    return receipt;
  }

  async updateReceiptPdfPath(id: string, pdfPath: string): Promise<Receipt> {
    const [receipt] = await db
      .update(receipts)
      .set({ pdfPath })
      .where(eq(receipts.id, id))
      .returning();
    return receipt;
  }

  async markReceiptEmailSent(id: string): Promise<Receipt> {
    const [receipt] = await db
      .update(receipts)
      .set({ emailSent: true })
      .where(eq(receipts.id, id))
      .returning();
    return receipt;
  }

  // Fraud Alert operations
  async createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert> {
    const [fraudAlert] = await db
      .insert(fraudAlerts)
      .values(alert)
      .returning();
    return fraudAlert;
  }

  async getFraudAlerts(): Promise<FraudAlert[]> {
    return await db
      .select()
      .from(fraudAlerts)
      .orderBy(desc(fraudAlerts.createdAt));
  }

  async getUnresolvedFraudAlerts(): Promise<FraudAlert[]> {
    return await db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.resolved, false))
      .orderBy(desc(fraudAlerts.createdAt));
  }

  async resolveFraudAlert(id: string, resolvedById: string): Promise<FraudAlert> {
    const [alert] = await db
      .update(fraudAlerts)
      .set({
        resolved: true,
        resolvedById,
        resolvedAt: new Date(),
      })
      .where(eq(fraudAlerts.id, id))
      .returning();
    return alert;
  }

  // Analytics operations
  async getTotalSales(): Promise<{ total: number; count: number }> {
    const [result] = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${giftCards.initialAmount} AS NUMERIC)), 0)`.mapWith(Number),
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(giftCards)
      .where(eq(giftCards.isActive, true));

    return result || { total: 0, count: 0 };
  }

  async getTotalRedemptions(): Promise<{ total: number; count: number }> {
    const [result] = await db
      .select({
        total: sql`COALESCE(SUM(CAST(${giftCardTransactions.amount} AS NUMERIC)), 0)`.mapWith(Number),
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.type, 'redeem'));

    return result || { total: 0, count: 0 };
  }

  async getActiveBalance(): Promise<number> {
    const [result] = await db
      .select({
        balance: sql`COALESCE(SUM(CAST(${giftCards.currentBalance} AS NUMERIC)), 0)`.mapWith(Number),
      })
      .from(giftCards)
      .where(and(
        eq(giftCards.isActive, true),
        sql`CAST(${giftCards.currentBalance} AS NUMERIC) > 0`
      ));

    return result?.balance || 0;
  }

  async getDashboardStats(): Promise<{
    totalSales: number;
    totalRedemptions: number;
    activeBalance: number;
    cardsIssued: number;
    redemptionsCount: number;
  }> {
    const [sales, redemptions, balance] = await Promise.all([
      this.getTotalSales(),
      this.getTotalRedemptions(),
      this.getActiveBalance(),
    ]);

    return {
      totalSales: sales.total,
      totalRedemptions: redemptions.total,
      activeBalance: balance,
      cardsIssued: sales.count,
      redemptionsCount: redemptions.count,
    };
  }

  // Saved Card operations
  async updateUserSquareCustomerId(userId: string, squareCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        squareCustomerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async addSavedCard(card: InsertSavedCard): Promise<SavedCard> {
    // If this is set as default, unset other defaults for this user
    if (card.isDefault) {
      await db
        .update(savedCards)
        .set({ isDefault: false })
        .where(eq(savedCards.userId, card.userId));
    }

    const [savedCard] = await db
      .insert(savedCards)
      .values(card)
      .returning();

    return savedCard;
  }

  async getUserSavedCards(userId: string): Promise<SavedCard[]> {
    return await db
      .select()
      .from(savedCards)
      .where(eq(savedCards.userId, userId))
      .orderBy(desc(savedCards.isDefault), desc(savedCards.createdAt));
  }

  async getSavedCardById(cardId: string, userId: string): Promise<SavedCard | undefined> {
    const [card] = await db
      .select()
      .from(savedCards)
      .where(and(
        eq(savedCards.id, cardId),
        eq(savedCards.userId, userId)
      ));

    return card;
  }

  async deleteSavedCard(cardId: string, userId: string): Promise<void> {
    await db
      .delete(savedCards)
      .where(and(
        eq(savedCards.id, cardId),
        eq(savedCards.userId, userId)
      ));
  }

  async setDefaultCard(cardId: string, userId: string): Promise<void> {
    // First, unset all defaults for this user
    await db
      .update(savedCards)
      .set({ isDefault: false })
      .where(eq(savedCards.userId, userId));

    // Then set the specified card as default
    await db
      .update(savedCards)
      .set({ 
        isDefault: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(savedCards.id, cardId),
        eq(savedCards.userId, userId)
      ));
  }

  async getDefaultCard(userId: string): Promise<SavedCard | undefined> {
    const [card] = await db
      .select()
      .from(savedCards)
      .where(and(
        eq(savedCards.userId, userId),
        eq(savedCards.isDefault, true)
      ));

    return card;
  }

  // Order History operations
  async getUserOrders(userId: string, page: number, pageSize: number): Promise<{
    orders: any[];
    totalCount: number;
  }> {
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(giftCards)
      .where(eq(giftCards.issuedById, userId));

    const totalCount = Number(countResult[0]?.count || 0);

    // Get paginated orders with transaction data
    const orders = await db
      .select({
        giftCard: giftCards,
        transaction: giftCardTransactions
      })
      .from(giftCards)
      .leftJoin(
        giftCardTransactions,
        and(
          eq(giftCardTransactions.giftCardId, giftCards.id),
          eq(giftCardTransactions.type, 'purchase')
        )
      )
      .where(eq(giftCards.issuedById, userId))
      .orderBy(desc(giftCards.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Transform data to OrderHistoryItem format
    const transformedOrders = orders.map(({ giftCard, transaction }) => {
      // Calculate redeemed amount
      const redeemedAmount = (
        parseFloat(giftCard.initialAmount) - parseFloat(giftCard.currentBalance)
      ).toFixed(2);

      return {
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.initialAmount,
        recipientName: giftCard.recipientName,
        recipientEmail: giftCard.recipientEmail,
        senderName: giftCard.senderName,
        design: giftCard.design,
        deliveryStatus: giftCard.deliveryStatus || 'sent',
        paymentMethodLast4: transaction?.paymentMethodLast4,
        paymentMethodType: transaction?.paymentMethodType,
        createdAt: giftCard.createdAt,
        isRedeemed: parseFloat(giftCard.currentBalance) < parseFloat(giftCard.initialAmount),
        redeemedAmount: parseFloat(redeemedAmount) > 0 ? redeemedAmount : undefined
      };
    });

    return {
      orders: transformedOrders,
      totalCount
    };
  }

  async getUserOrderDetails(userId: string, orderId: string): Promise<any | undefined> {
    const result = await db
      .select({
        giftCard: giftCards,
        transaction: giftCardTransactions
      })
      .from(giftCards)
      .leftJoin(
        giftCardTransactions,
        and(
          eq(giftCardTransactions.giftCardId, giftCards.id),
          eq(giftCardTransactions.type, 'purchase')
        )
      )
      .where(and(
        eq(giftCards.id, orderId),
        eq(giftCards.issuedById, userId)
      ));

    if (!result.length) {
      return undefined;
    }

    const { giftCard, transaction } = result[0];

    // Get all transactions for this gift card
    const transactions = await db
      .select()
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.giftCardId, orderId))
      .orderBy(desc(giftCardTransactions.createdAt));

    // Calculate redeemed amount
    const redeemedAmount = (
      parseFloat(giftCard.initialAmount) - parseFloat(giftCard.currentBalance)
    ).toFixed(2);

    return {
      id: giftCard.id,
      code: giftCard.code,
      amount: giftCard.initialAmount,
      currentBalance: giftCard.currentBalance,
      recipientName: giftCard.recipientName,
      recipientEmail: giftCard.recipientEmail,
      senderName: giftCard.senderName,
      design: giftCard.design,
      deliveryStatus: giftCard.deliveryStatus || 'sent',
      customMessage: giftCard.customMessage,
      paymentMethodLast4: transaction?.paymentMethodLast4,
      paymentMethodType: transaction?.paymentMethodType,
      createdAt: giftCard.createdAt,
      isRedeemed: parseFloat(giftCard.currentBalance) < parseFloat(giftCard.initialAmount),
      redeemedAmount: parseFloat(redeemedAmount) > 0 ? redeemedAmount : undefined,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
        notes: t.notes
      }))
    };
  }

  // Revenue tracking operations
  async getGiftCardRevenue(giftCardId: string): Promise<{ totalRedeemed: number; redemptionCount: number }> {
    const redemptions = await db
      .select({
        amount: giftCardTransactions.amount
      })
      .from(giftCardTransactions)
      .where(and(
        eq(giftCardTransactions.giftCardId, giftCardId),
        eq(giftCardTransactions.type, 'redemption')
      ));

    const totalRedeemed = redemptions.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return {
      totalRedeemed,
      redemptionCount: redemptions.length
    };
  }

  async getUserTotalSpending(email: string): Promise<{ totalSpent: number; purchaseCount: number }> {
    // First, try to find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return { totalSpent: 0, purchaseCount: 0 };
    }

    // Get all gift cards purchased by this user
    const purchases = await db
      .select({
        amount: giftCards.initialAmount
      })
      .from(giftCards)
      .where(eq(giftCards.issuedById, user.id));

    const totalSpent = purchases.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
      totalSpent,
      purchaseCount: purchases.length
    };
  }

  // Fee Configuration operations
  async getFeeConfigurations(): Promise<FeeConfiguration[]> {
    return await db
      .select()
      .from(feeConfigurations)
      .where(eq(feeConfigurations.isActive, true))
      .orderBy(feeConfigurations.feeType);
  }

  async getFeeByType(feeType: string): Promise<FeeConfiguration | undefined> {
    const [fee] = await db
      .select()
      .from(feeConfigurations)
      .where(and(
        eq(feeConfigurations.feeType, feeType),
        eq(feeConfigurations.isActive, true)
      ));
    return fee;
  }

  async createFeeConfiguration(fee: InsertFeeConfiguration): Promise<FeeConfiguration> {
    const [newFee] = await db
      .insert(feeConfigurations)
      .values({
        ...fee,
        updatedAt: new Date()
      })
      .returning();
    return newFee;
  }

  async updateFeeConfiguration(id: string, fee: Partial<InsertFeeConfiguration>): Promise<FeeConfiguration> {
    const [updatedFee] = await db
      .update(feeConfigurations)
      .set({
        ...fee,
        updatedAt: new Date()
      })
      .where(eq(feeConfigurations.id, id))
      .returning();
    return updatedFee;
  }

  async deleteFeeConfiguration(id: string): Promise<void> {
    await db
      .update(feeConfigurations)
      .set({ isActive: false })
      .where(eq(feeConfigurations.id, id));
  }

  async calculateFeeAmount(cardAmount: number, feeType: string): Promise<number> {
    const fee = await this.getFeeByType(feeType);
    if (!fee) {
      return 0;
    }

    let calculatedFee = 0;
    const feeAmount = parseFloat(fee.feeAmount);

    if (fee.isPercentage) {
      calculatedFee = (cardAmount * feeAmount) / 100;
    } else {
      calculatedFee = feeAmount;
    }

    // Apply min/max limits if specified
    if (fee.minAmount && calculatedFee < parseFloat(fee.minAmount)) {
      calculatedFee = parseFloat(fee.minAmount);
    }
    if (fee.maxAmount && calculatedFee > parseFloat(fee.maxAmount)) {
      calculatedFee = parseFloat(fee.maxAmount);
    }

    return Math.round(calculatedFee * 100) / 100; // Round to 2 decimal places
  }

  async createPaymentRecord(payment: InsertSquarePayment): Promise<SquarePayment> {
    const [record] = await db
      .insert(squarePayments)
      .values({
        ...payment,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return record;
  }

  async updateTransactionStatus(orderId: string, status: string): Promise<void> {
    await db
      .update(squarePayments)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(squarePayments.orderId, orderId));
  }

  // Merchant connection operations (for OAuth)
  async createMerchantConnection(connection: InsertMerchantConnection): Promise<MerchantConnection> {
    const [newConnection] = await db
      .insert(merchantConnections)
      .values({
        ...connection,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newConnection;
  }

  async getMerchantConnection(userId: string, merchantId: string): Promise<MerchantConnection | undefined> {
    const [connection] = await db
      .select()
      .from(merchantConnections)
      .where(and(
        eq(merchantConnections.userId, userId),
        eq(merchantConnections.merchantId, merchantId),
        eq(merchantConnections.isActive, true)
      ));
    return connection;
  }

  async getMerchantConnections(userId: string): Promise<MerchantConnection[]> {
    return await db
      .select()
      .from(merchantConnections)
      .where(and(
        eq(merchantConnections.userId, userId),
        eq(merchantConnections.isActive, true)
      ))
      .orderBy(desc(merchantConnections.createdAt));
  }

  async updateMerchantConnection(id: string, updates: Partial<InsertMerchantConnection>): Promise<MerchantConnection> {
    const [connection] = await db
      .update(merchantConnections)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(merchantConnections.id, id))
      .returning();
    return connection;
  }

  async deleteMerchantConnection(id: string): Promise<void> {
    await db
      .update(merchantConnections)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(merchantConnections.id, id));
  }

  // OAuth state operations
  async createOAuthState(state: string, userId: string, expiresAt: Date): Promise<void> {
    await db.insert(oauthStates).values({
      state,
      userId,
      expiresAt
    });
  }

  async getOAuthState(state: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const [result] = await db
      .select()
      .from(oauthStates)
      .where(eq(oauthStates.state, state));
    
    if (result && result.userId) {
      return {
        userId: result.userId,
        expiresAt: result.expiresAt
      };
    }
    return undefined;
  }

  async deleteOAuthState(state: string): Promise<void> {
    await db.delete(oauthStates).where(eq(oauthStates.state, state));
  }

  async cleanupExpiredOAuthStates(): Promise<void> {
    await db
      .delete(oauthStates)
      .where(lt(oauthStates.expiresAt, new Date()));
  }

  // Rate limiting operations
  async checkRateLimit(identifier: string, endpoint: string, windowMs: number, maxRequests: number): Promise<boolean> {
    const windowStart = new Date(Date.now() - windowMs);
    
    // Count requests in the window
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rateLimits)
      .where(and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.endpoint, endpoint),
        gte(rateLimits.windowStart, windowStart)
      ));

    const requestCount = result?.count || 0;
    return requestCount < maxRequests;
  }

  async incrementRateLimit(identifier: string, endpoint: string): Promise<void> {
    await db.insert(rateLimits).values({
      identifier,
      endpoint,
      windowStart: new Date()
    });
  }

  async cleanupExpiredRateLimits(): Promise<void> {
    // Clean up rate limits older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, cutoffTime));
  }

  // Webhook event operations  
  async createWebhookEvent(event: any): Promise<void> {
    await db.insert(webhookEvents).values({
      eventId: event.id || nanoid(),
      eventType: event.type,
      eventData: event,
      merchantId: event.merchant_id,
      processedAt: new Date()
    });
  }

  async getWebhookEvents(limit: number = 100): Promise<any[]> {
    return await db
      .select()
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.processedAt))
      .limit(limit);
  }

  // Webhook subscription operations
  async createWebhookSubscription(subscription: any): Promise<void> {
    await db.insert(webhookSubscriptions).values({
      ...subscription,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async updateWebhookSubscription(id: string, updates: any): Promise<void> {
    await db
      .update(webhookSubscriptions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(webhookSubscriptions.id, id));
  }

  async deleteWebhookSubscription(id: string): Promise<void> {
    await db
      .update(webhookSubscriptions)
      .set({
        isEnabled: false,
        updatedAt: new Date()
      })
      .where(eq(webhookSubscriptions.id, id));
  }

  async getWebhookSubscriptions(): Promise<any[]> {
    return await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.isEnabled, true))
      .orderBy(desc(webhookSubscriptions.createdAt));
  }

  // Additional missing operations
  async createEmailTemplate(template: any): Promise<any> {
    const [result] = await db
      .insert(emailTemplates)
      .values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async updateEmailTemplate(id: string, updates: any): Promise<any> {
    const [result] = await db
      .update(emailTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.id, id))
      .returning();
    return result;
  }

  async getEmailTemplates(): Promise<any[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true))
      .orderBy(emailTemplates.name);
  }

  async getEmailTemplate(id: string): Promise<any | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db
      .update(emailTemplates)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.id, id));
  }

  async createGiftCardDesign(design: any): Promise<any> {
    const [result] = await db
      .insert(giftCardDesigns)
      .values({
        ...design,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async updateGiftCardDesign(id: string, updates: any): Promise<any> {
    const [result] = await db
      .update(giftCardDesigns)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(giftCardDesigns.id, id))
      .returning();
    return result;
  }

  async getGiftCardDesigns(): Promise<any[]> {
    return await db
      .select()
      .from(giftCardDesigns)
      .where(eq(giftCardDesigns.isActive, true))
      .orderBy(desc(giftCardDesigns.createdAt));
  }

  async getGiftCardDesign(id: string): Promise<any | undefined> {
    const [design] = await db
      .select()
      .from(giftCardDesigns)
      .where(eq(giftCardDesigns.id, id));
    return design;
  }

  async deleteGiftCardDesign(id: string): Promise<void> {
    await db
      .update(giftCardDesigns)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(giftCardDesigns.id, id));
  }

  async createAuditLog(log: any): Promise<void> {
    await db.insert(auditLogs).values({
      ...log,
      createdAt: new Date()
    });
  }

  async getAuditLogs(limit: number = 100, filters?: any): Promise<any[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getSystemSetting(key: string): Promise<any | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting?.value;
  }

  async setSystemSetting(key: string, value: any, category: string = 'general'): Promise<void> {
    await db
      .insert(systemSettings)
      .values({
        category,
        key,
        value,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          updatedAt: new Date()
        }
      });
  }

  async createRefund(refund: any): Promise<any> {
    const [result] = await db
      .insert(refunds)
      .values({
        ...refund,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async getRefunds(): Promise<any[]> {
    return await db
      .select()
      .from(refunds)
      .orderBy(desc(refunds.createdAt));
  }

  async getRefund(id: string): Promise<any | undefined> {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.id, id));
    return refund;
  }

  async createDispute(dispute: any): Promise<any> {
    const [result] = await db
      .insert(disputes)
      .values({
        ...dispute,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async getDisputes(): Promise<any[]> {
    return await db
      .select()
      .from(disputes)
      .orderBy(desc(disputes.createdAt));
  }

  async getDispute(id: string): Promise<any | undefined> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, id));
    return dispute;
  }

  async updateDispute(id: string, updates: any): Promise<any> {
    const [result] = await db
      .update(disputes)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(disputes.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();