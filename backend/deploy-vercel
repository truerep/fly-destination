#!/bin/bash

echo "🚀 Vercel Deployment Helper for Fly Destination Backend"
echo "========================================================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is ready"
echo ""

# Check if .env-local file exists
if [ -f .env-local ]; then
    echo "✅ Environment file found (.env-local)"
    echo "📝 Make sure to add these variables to Vercel:"
    echo ""
    echo "Required variables:"
    echo "- MONGODB_URI"
    echo "- JWT_SECRET"
    echo "- JWT_EXPIRE"
    echo "- NODE_ENV=production"
    echo ""
    echo "Email variables:"
    echo "- SMTP_HOST"
    echo "- SMTP_PORT"
    echo "- SMTP_USER"
    echo "- SMTP_PASS"
    echo ""
    echo "Other variables:"
    echo "- IMGBB_API_KEY"
    echo "- RATE_LIMIT_WINDOW_MS"
    echo "- RATE_LIMIT_MAX_REQUESTS"
    echo "- FRONTEND_URL"
else
    echo "⚠️  No .env-local file found!"
    echo "📝 Please create environment variables in Vercel dashboard"
fi

echo ""
echo "🔍 Checking deployment files..."

# Check if vercel.json exists
if [ -f vercel.json ]; then
    echo "✅ vercel.json found"
else
    echo "❌ vercel.json not found!"
    exit 1
fi

# Check if server.js exists
if [ -f server.js ]; then
    echo "✅ server.js found"
else
    echo "❌ server.js not found!"
    exit 1
fi

# Check if package.json exists
if [ -f package.json ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found!"
    exit 1
fi

echo ""
echo "🎯 Ready to deploy!"
echo ""
echo "📋 Deployment options:"
echo ""
echo "Option 1: Deploy via Vercel Dashboard (Recommended)"
echo "1. Go to https://vercel.com"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository"
echo "4. Set Root Directory to 'backend'"
echo "5. Add environment variables"
echo "6. Deploy!"
echo ""
echo "Option 2: Deploy via CLI"
echo "Run: vercel"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT.md"
echo ""
echo "🔗 Your API will be available at: https://your-project.vercel.app"
echo "🔗 Health check: https://your-project.vercel.app/health"
