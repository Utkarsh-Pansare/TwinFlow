#!/bin/bash
# Quick Start Script for TwinFlow Dashboard

echo "🚀 TwinFlow Modern Logistics Analytics Dashboard"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the frontend directory:"
    echo "  cd frontend"
    exit 1
fi

echo "✅ Package.json found"
echo ""

# Check Node version
NODE_VERSION=$(node -v)
echo "📦 Node.js version: $NODE_VERSION"
echo ""

# Ask what to do
echo "What would you like to do?"
echo "1. Install dependencies"
echo "2. Start development server"
echo "3. Build for production"
echo "4. Check build status"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📥 Installing dependencies..."
        npm install
        echo "✅ Dependencies installed successfully!"
        echo ""
        echo "Next, run: npm run dev"
        ;;
    2)
        echo ""
        echo "🔧 Starting development server..."
        echo "Dashboard will be available at: http://localhost:5173/app/dashboard"
        echo ""
        npm run dev
        ;;
    3)
        echo ""
        echo "🏗️ Building for production..."
        npm run build
        echo ""
        echo "✅ Build complete! Files are in ./dist"
        ;;
    4)
        echo ""
        echo "📊 Checking build status..."
        npm run build 2>&1 | tail -20
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "For more information, see:"
echo "  - DASHBOARD_SETUP_GUIDE.md"
echo "  - frontend/REAL_DATA_INTEGRATION.tsx"
echo "  - frontend/src/components/dashboard/README.md"
echo ""
