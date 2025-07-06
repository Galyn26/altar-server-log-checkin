import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "https://altar-server-checkin.onrender.com/api/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      // Save user info to session or DB if needed
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0].value,
        photo: profile.photos?.[0].value,
      };
      return done(null, user);
    }
  ));

  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  app.get("/api/login", passport.authenticate("google", {
    scope: ["profile", "email"]
  }));

  app.get("/api/callback",
    passport.authenticate("google", {
      failureRedirect: "/",
      successRedirect: "/",
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";

import connectPg from "connect-pg-simple";
import { storage } from "./storage";





export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
   conObject: {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
},
createTableIfMissing: true,
ttl: sessionTtl,
tableName: "sessions",
});
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // Session setup
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `https://${process.env.DOMAIN}/api/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    await storage.upsertUser({
      id: profile.id,
      email: profile.emails?.[0].value!,
      firstName: profile.name?.givenName || "",
      lastName: profile.name?.familyName || "",
      profileImageUrl: profile.photos?.[0].value || "",
    });
    done(null, profile);
  }));

  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  // Login route
  app.get("/api/login", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  // Callback route
  app.get("/api/callback", passport.authenticate("google", {
    failureRedirect: "/api/login",
    successRedirect: "/",
  }));

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}


export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

app.get("/api/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});
