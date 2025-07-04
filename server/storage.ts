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
  getUserByEmail(email: string): Promise<User | undefined>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
    // Verify location if coordinates provided
    let locationVerified = false;
    if (session.clockInLatitude && session.clockInLongitude) {
      locationVerified = this.verifyChurchLocation(
        parseFloat(session.clockInLatitude),
        parseFloat(session.clockInLongitude)
      );
    }

    const [serviceSession] = await db
      .insert(serviceSessions)
      .values({
        ...session,
        clockInTime: new Date(),
        clockInLocationVerified: locationVerified,
      })
      .returning();
    return serviceSession;
  }

  // Helper function to verify if location is near church
  private verifyChurchLocation(latitude: number, longitude: number): boolean {
    // Saint Catherine of Siena Catholic Church coordinates
    // 9200 SW 107th Ave, Miami, FL 33176
    const CHURCH_LAT = 25.68222;
    const CHURCH_LNG = -80.36861;
    const MAX_DISTANCE_METERS = 100; // 100 meter radius - adjust as needed

    const distance = this.calculateDistance(latitude, longitude, CHURCH_LAT, CHURCH_LNG);
    return distance <= MAX_DISTANCE_METERS;
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
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
