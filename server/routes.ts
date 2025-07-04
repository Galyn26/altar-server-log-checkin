import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertServiceSessionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Service session routes
  app.post('/api/sessions/clock-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has an active session
      const activeSession = await storage.getCurrentActiveSession(userId);
      if (activeSession) {
        return res.status(400).json({ message: "You are already clocked in" });
      }

      const validatedData = insertServiceSessionSchema.parse({
        userId,
        serviceType: req.body.serviceType || "General Service",
      });

      const session = await storage.createServiceSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error clocking in:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post('/api/sessions/clock-out', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const activeSession = await storage.getCurrentActiveSession(userId);
      if (!activeSession) {
        return res.status(400).json({ message: "No active session found" });
      }

      const clockOutTime = new Date();
      const duration = Math.round((clockOutTime.getTime() - activeSession.clockInTime.getTime()) / (1000 * 60));

      const updatedSession = await storage.updateServiceSession(activeSession.id, {
        clockOutTime,
        duration,
        isActive: false,
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get('/api/sessions/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeSession = await storage.getCurrentActiveSession(userId);
      res.json(activeSession);
    } catch (error) {
      console.error("Error fetching current session:", error);
      res.status(500).json({ message: "Failed to fetch current session" });
    }
  });

  app.get('/api/sessions/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await storage.getUserServiceSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching session history:", error);
      res.status(500).json({ message: "Failed to fetch session history" });
    }
  });

  app.get('/api/sessions/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
