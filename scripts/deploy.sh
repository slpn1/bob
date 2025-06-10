#!/bin/bash

# Deploy script for Heroku
# This script stages changes, commits to current branch, and pushes to heroku main
# Usage: ./deploy.sh "Your commit message"

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if there are any changes to stage
if [[ -n $(git status --porcelain) ]]; then
    echo "📦 Staging changes..."
    git add .
    
    echo "💬 Committing changes..."
    # Use provided commit message or default to timestamp
    if [[ -n "$1" ]]; then
        COMMIT_MESSAGE="$1"
        echo "📝 Using custom message: $COMMIT_MESSAGE"
    else
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        COMMIT_MESSAGE="Deploy: $TIMESTAMP"
        echo "📝 Using default message: $COMMIT_MESSAGE"
    fi
    
    git commit -m "$COMMIT_MESSAGE"
else
    echo "✅ No changes to stage"
fi

# Check if heroku remote exists
if git remote | grep -q "^heroku$"; then
    echo "🌐 Found Heroku remote"
else
    echo "❌ Error: Heroku remote not found. Please add Heroku remote first:"
    echo "   git remote add heroku https://git.heroku.com/your-app-name.git"
    exit 1
fi

# Push current branch to heroku main
echo "🚀 Pushing $CURRENT_BRANCH to heroku main..."
git push heroku $CURRENT_BRANCH:main

echo "✅ Deployment complete!"
echo "🎉 Your app should be available at your Heroku URL" 