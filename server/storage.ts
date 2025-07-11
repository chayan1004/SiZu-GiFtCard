import {
  users,
  giftCards,
  giftCardTransactions,
  receipts,
  fraudAlerts,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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
        total: sql`COALESCE(SUM(${giftCards.initialAmount}), 0)`.mapWith(Number),
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(giftCards)
      .where(eq(giftCards.isActive, true));
    
    return result || { total: 0, count: 0 };
  }

  async getTotalRedemptions(): Promise<{ total: number; count: number }> {
    const [result] = await db
      .select({
        total: sql`COALESCE(SUM(${giftCardTransactions.amount}), 0)`.mapWith(Number),
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.type, 'redeem'));
    
    return result || { total: 0, count: 0 };
  }

  async getActiveBalance(): Promise<number> {
    const [result] = await db
      .select({
        balance: sql`COALESCE(SUM(${giftCards.currentBalance}), 0)`.mapWith(Number),
      })
      .from(giftCards)
      .where(and(
        eq(giftCards.isActive, true),
        sql`${giftCards.currentBalance} > 0`
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
}

export const storage = new DatabaseStorage();
