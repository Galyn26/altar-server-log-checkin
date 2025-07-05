# Altar Server Check-In System

A modern web application for tracking altar server check-ins and service hours at Saint Catherine of Siena Catholic Church.

## Features

- 🔐 **Secure Authentication** - Replit OAuth integration
- ⏱️ **Time Tracking** - Clock in/out functionality with automatic duration calculation
- 📍 **Location Verification** - GPS-based verification to ensure servers are at church
- 📊 **Statistics Dashboard** - Weekly and monthly service hour tracking
- 👥 **User Management** - Role-based access control (servers and moderators)
- 📄 **Data Export** - CSV export of service records
- 📱 **Mobile Responsive** - Works on all devices

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Environment variables (see below)

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
REPLIT_DOMAINS=your_domain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your_repl_id
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Render Deployment

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure Build & Deploy Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Add Environment Variables** in Render dashboard
5. **Deploy**

### Environment Variables for Render

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session encryption
- `REPLIT_DOMAINS` - Your render domain (e.g., `yourapp.onrender.com`)
- `ISSUER_URL` - `https://replit.com/oidc`
- `REPL_ID` - Your Replit app ID

## Initial Setup

### Creating the First Moderator

1. Both you and your moderator need to log in once to create accounts
2. Access your PostgreSQL database
3. Run this query to make someone a moderator:

```sql
-- View all users first
SELECT id, email, role FROM users;

-- Make user a moderator (replace USER_ID with actual ID)
UPDATE users SET role = 'moderator' WHERE id = 'USER_ID';
```

## Church Location Configuration

The system is pre-configured for:
- **Saint Catherine of Siena Catholic Church**
- **Address**: 9200 SW 107th Ave, Miami, FL 33176
- **GPS Coordinates**: 25.68222, -80.36861
- **Verification Range**: 100 meters

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OAuth (OpenID Connect)
- **Deployment**: Render (recommended)

## Support

For issues or questions:
1. Check the `MODERATOR_SETUP.md` file for setup instructions
2. Review the `replit.md` file for technical details
3. Contact your system administrator

## License

MIT License - See LICENSE file for details