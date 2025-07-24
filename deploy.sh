#!/bin/bash

echo "🚀 Starting CPE Sync deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p exports

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Stopping existing process..."
    pkill -f "node server.js"
    sleep 2
fi

# Start the server
echo "🌟 Starting CPE Sync server..."
echo ""
echo "🎓 CPE Sync - Centralized Attendance & Event Tracking System"
echo "=========================================================="
echo ""
echo "🌐 Application URL: http://localhost:3000"
echo "🔑 Admin Code: CPE-SYNC-ADMIN-2025"
echo ""
echo "📋 Quick Start Guide:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Register as a student or login as admin"
echo "3. Admins: Create events and monitor attendance"
echo "4. Students: View events and submit attendance"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "=========================================================="
echo ""

node server.js