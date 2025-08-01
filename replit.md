# Altar Server Check-In System

## Overview

This is a full-stack web application for tracking altar server check-ins and service hours. The system allows altar servers to clock in and out of their service sessions, view their service history, and track their weekly and monthly service statistics.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Database Driver**: Neon serverless PostgreSQL driver

## Key Components

### Authentication System
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Protected Routes**: Middleware-based authentication checks
- **User Management**: Automatic user creation/update on login
- **Role-Based Access**: Support for 'server' and 'moderator' user roles

### Database Schema
- **Users Table**: Stores user profile information from Replit Auth with role column
- **Service Sessions Table**: Tracks clock-in/out times and service details
- **Sessions Table**: Stores Express session data

### Service Tracking
- **Clock In/Out**: REST API endpoints for time tracking
- **Duration Calculation**: Automatic calculation of service hours
- **Statistics**: Weekly and monthly service hour summaries
- **Service Types**: Categorization of different service types

### Moderator Features
- **User Management**: View all users and update user roles
- **Service Oversight**: View all service sessions across users
- **Statistics Dashboard**: Overall system statistics and usage metrics
- **Data Export**: CSV export of all service logs for record keeping
- **Access Control**: Protected routes requiring moderator privileges
- **Setup Process**: First moderator must be manually created via database query

### Geolocation Tracking
- **Location Verification**: Browser geolocation API integration for clock-in
- **Church Proximity Check**: Haversine formula distance calculation
- **Location Status**: Visual indicators for verified/unverified locations
- **GPS Data Storage**: Latitude/longitude coordinates stored with sessions
- **Configuration**: Church coordinates configurable in server/storage.ts

### UI Components
- **Landing Page**: Simple authentication entry point
- **Dashboard**: Main interface showing current status and statistics
- **Service History**: List of past service sessions
- **Moderator Dashboard**: Administrative interface for oversight
- **Real-time Updates**: Live duration tracking for active sessions

## Data Flow

1. **Authentication**: User authenticates via Replit Auth
2. **Session Management**: Express sessions track user login state
3. **Clock In**: User initiates service session via API
4. **Active Session**: Real-time duration tracking in UI
5. **Clock Out**: User ends session, duration calculated and stored
6. **Statistics**: Aggregated data displayed in dashboard

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: UI component primitives
- **passport & openid-client**: Authentication handling
- **express-session**: Session management

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Production bundling

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles Express server to `dist/index.js`
3. **Static Assets**: Served from build output directory

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for authentication
- `ISSUER_URL`: OpenID Connect issuer URL

### Production Setup
- Node.js runtime environment
- PostgreSQL database (Neon serverless or Render PostgreSQL)
- Static file serving for frontend assets
- Session persistence in database
- Render deployment with automated builds

### Deployment Structure
- **README.md** - Project overview and setup instructions
- **DEPLOYMENT.md** - Comprehensive deployment guide for Render
- **MODERATOR_SETUP.md** - First moderator setup instructions
- **render.yaml** - Render deployment configuration
- **.env.example** - Environment variables template
- **setup.sh** - Automated setup script
- **LICENSE** - MIT license for the project

## Changelog

```
Changelog:
- July 04, 2025. Initial setup with basic check-in/out functionality
- July 04, 2025. Added moderator accounts with oversight capabilities
- July 04, 2025. Implemented geolocation tracking for location verification
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```