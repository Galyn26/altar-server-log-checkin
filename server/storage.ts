import {
  users,
  serviceSessions,
  type User,
  type UpsertUser,
  type ServiceSession,
  type InsertServiceSession,
  type UpdateServiceSession,
  type UpdateUserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Service session operations
  createServiceSession(session: InsertServiceSession): Promise<ServiceSession>;
  updateServiceSession(id: number, updates: UpdateServiceSession): Promise<ServiceSession>;
  getCurrentActiveSession(userId: string): Promise<ServiceSession | undefined>;
  getUserServiceSessions(userId: string, limit?: number): Promise<ServiceSession[]>;
  getUserStats(userId: string): Promise<{
    weeklyHours: number;
    weeklyServices: number;
    monthlyHours: number;
    monthlyServices: number;
  }>;
  
  // Moderator operations
  getAllUsers(): Promise<User[]>;
  getAllServiceSessions(limit?: number): Promise<ServiceSession[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  getOverallStats(): Promise<{
    totalUsers: number;
    totalActiveUsers: number;
    totalHoursThisWeek: number;
    totalHoursThisMonth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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

  // Service session operations
  async createServiceSession(session: InsertServiceSession): Promise<ServiceSession> {
    const [serviceSession] = await db
      .insert(serviceSessions)
      .values({
        ...session,
        clockInTime: new Date(),
      })
      .returning();
    return serviceSession;
  }

  async updateServiceSession(id: number, updates: UpdateServiceSession): Promise<ServiceSession> {
    const [serviceSession] = await db
      .update(serviceSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(serviceSessions.id, id))
      .returning();
    return serviceSession;
  }

  async getCurrentActiveSession(userId: string): Promise<ServiceSession | undefined> {
    const [session] = await db
      .select()
      .from(serviceSessions)
      .where(
        and(
          eq(serviceSessions.userId, userId),
          eq(serviceSessions.isActive, true)
        )
      )
      .orderBy(desc(serviceSessions.clockInTime));
    return session;
  }

  async getUserServiceSessions(userId: string, limit = 10): Promise<ServiceSession[]> {
    const sessions = await db
      .select()
      .from(serviceSessions)
      .where(eq(serviceSessions.userId, userId))
      .orderBy(desc(serviceSessions.clockInTime))
      .limit(limit);
    return sessions;
  }

  async getUserStats(userId: string): Promise<{
    weeklyHours: number;
    weeklyServices: number;
    monthlyHours: number;
    monthlyServices: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    // Weekly stats
    const weeklyStats = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${serviceSessions.duration}), 0)`,
        totalServices: sql<number>`COUNT(*)`,
      })
      .from(serviceSessions)
      .where(
        and(
          eq(serviceSessions.userId, userId),
          gte(serviceSessions.clockInTime, weekAgo),
          eq(serviceSessions.isActive, false)
        )
      );

    // Monthly stats
    const monthlyStats = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${serviceSessions.duration}), 0)`,
        totalServices: sql<number>`COUNT(*)`,
      })
      .from(serviceSessions)
      .where(
        and(
          eq(serviceSessions.userId, userId),
          gte(serviceSessions.clockInTime, monthAgo),
          eq(serviceSessions.isActive, false)
        )
      );

    return {
      weeklyHours: Math.round((weeklyStats[0]?.totalMinutes || 0) / 60 * 10) / 10,
      weeklyServices: weeklyStats[0]?.totalServices || 0,
      monthlyHours: Math.round((monthlyStats[0]?.totalMinutes || 0) / 60 * 10) / 10,
      monthlyServices: monthlyStats[0]?.totalServices || 0,
    };
  }

  // Moderator operations
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getAllServiceSessions(limit = 100): Promise<ServiceSession[]> {
    const sessions = await db
      .select()
      .from(serviceSessions)
      .orderBy(desc(serviceSessions.clockInTime))
      .limit(limit);
    return sessions;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getOverallStats(): Promise<{
    totalUsers: number;
    totalActiveUsers: number;
    totalHoursThisWeek: number;
    totalHoursThisMonth: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total users
    const totalUsers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);

    // Active users this week
    const activeUsers = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${serviceSessions.userId})` })
      .from(serviceSessions)
      .where(gte(serviceSessions.clockInTime, weekAgo));

    // Total hours this week
    const weeklyHours = await db
      .select({ totalMinutes: sql<number>`COALESCE(SUM(${serviceSessions.duration}), 0)` })
      .from(serviceSessions)
      .where(
        and(
          gte(serviceSessions.clockInTime, weekAgo),
          eq(serviceSessions.isActive, false)
        )
      );

    // Total hours this month
    const monthlyHours = await db
      .select({ totalMinutes: sql<number>`COALESCE(SUM(${serviceSessions.duration}), 0)` })
      .from(serviceSessions)
      .where(
        and(
          gte(serviceSessions.clockInTime, monthAgo),
          eq(serviceSessions.isActive, false)
        )
      );

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalActiveUsers: activeUsers[0]?.count || 0,
      totalHoursThisWeek: Math.round((weeklyHours[0]?.totalMinutes || 0) / 60 * 10) / 10,
      totalHoursThisMonth: Math.round((monthlyHours[0]?.totalMinutes || 0) / 60 * 10) / 10,
    };
  }
}

export const storage = new DatabaseStorage();
