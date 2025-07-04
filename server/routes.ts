import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertServiceSessionSchema, updateUserRoleSchema } from "@shared/schema";

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

  // Middleware to check if user is moderator
  const isModerator = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'moderator') {
      return res.status(403).json({ message: "Moderator access required" });
    }
    
    next();
  };

  // Moderator routes
  app.get('/api/moderator/users', isAuthenticated, isModerator, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/moderator/sessions', isAuthenticated, isModerator, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const sessions = await storage.getAllServiceSessions(limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/moderator/stats', isAuthenticated, isModerator, async (req: any, res) => {
    try {
      const stats = await storage.getOverallStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching overall stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.put('/api/moderator/users/:userId/role', isAuthenticated, isModerator, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const validatedData = updateUserRoleSchema.parse(req.body);
      
      const user = await storage.updateUserRole(userId, validatedData.role!);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get('/api/moderator/export', isAuthenticated, isModerator, async (req: any, res) => {
    try {
      const sessions = await storage.getAllServiceSessions(1000);
      const users = await storage.getAllUsers();
      
      // Create CSV content
      const csvHeaders = 'User ID,User Name,Email,Service Type,Clock In Time,Clock Out Time,Duration (minutes),Status,Date\n';
      const csvRows = sessions.map(session => {
        const user = users.find(u => u.id === session.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown';
        const clockInTime = new Date(session.clockInTime).toISOString();
        const clockOutTime = session.clockOutTime ? new Date(session.clockOutTime).toISOString() : 'N/A';
        const duration = session.duration || 0;
        const status = session.isActive ? 'Active' : 'Completed';
        const date = new Date(session.clockInTime).toDateString();
        
        return `"${session.userId}","${userName}","${user?.email || 'N/A'}","${session.serviceType}","${clockInTime}","${clockOutTime}","${duration}","${status}","${date}"`;
      }).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=altar_server_logs.csv');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
