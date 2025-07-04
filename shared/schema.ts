import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("server").notNull(), // 'server' or 'moderator'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service sessions table for tracking check-ins/check-outs
export const serviceSessions = pgTable("service_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  serviceType: varchar("service_type").default("General Service"),
  duration: integer("duration_minutes"), // calculated in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceSessionSchema = createInsertSchema(serviceSessions).pick({
  userId: true,
  serviceType: true,
});

export const updateServiceSessionSchema = createInsertSchema(serviceSessions).pick({
  clockOutTime: true,
  duration: true,
  isActive: true,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['server', 'moderator']),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ServiceSession = typeof serviceSessions.$inferSelect;
export type InsertServiceSession = z.infer<typeof insertServiceSessionSchema>;
export type UpdateServiceSession = z.infer<typeof updateServiceSessionSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
