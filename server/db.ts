import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pooling for better performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections in pool
  idleTimeoutMillis: 20000,          // Close idle connections after 20s
  connectionTimeoutMillis: 60000,       // Fail after 60s if can't connect
});

export const db = drizzle({ client: pool, schema });

// Graceful shutdown handler (optional, but recommended)
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("user").notNull(),
  squareCustomerId: text("square_customer_id"),
  // Customer authentication fields
  password: text("password"), // For customer accounts
  isEmailVerified: boolean("is_email_verified").default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetExpires: timestamp("reset_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});