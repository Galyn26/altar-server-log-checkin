#!/bin/bash

# Altar Server Check-In System Setup Script
# This script helps prepare the project for deployment

echo "🏛️  Altar Server Check-In System Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "Not installed")
if [ "$NODE_VERSION" = "Not installed" ]; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ before continuing."
    exit 1
fi
echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual values before running the application."
else
    echo "✅ .env file already exists"
fi

# Check database connection
echo "🗄️  Checking database configuration..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set in environment. Please configure your database."
else
    echo "✅ Database URL configured"
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Show next steps
echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Edit .env file with your actual values:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - SESSION_SECRET (random secure string)"
echo "   - REPLIT_DOMAINS (your domain)"
echo "   - REPL_ID (your Replit app ID)"
echo ""
echo "2. Push database schema:"
echo "   npm run db:push"
echo ""
echo "3. For local development:"
echo "   npm run dev"
echo ""
echo "4. For production:"
echo "   npm start"
echo ""
echo "5. Create first moderator (after both users log in):"
echo "   See MODERATOR_SETUP.md for instructions"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - DEPLOYMENT.md - Deployment guide"
echo "   - MODERATOR_SETUP.md - Moderator setup"
echo ""
echo "🚀 Ready for deployment to Render!"