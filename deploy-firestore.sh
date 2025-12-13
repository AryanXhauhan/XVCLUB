#!/bin/bash

# Firebase Firestore Deployment Script
# Run this script to deploy Firestore rules and indexes

echo "🔥 Deploying Firestore Rules and Indexes..."

# Check if logged in
if ! npx firebase login:list | grep -q "@"; then
    echo "⚠️  Not logged in. Please run: npx firebase login"
    exit 1
fi

# Set project
echo "📦 Setting Firebase project to xvalente-1ddbd..."
npx firebase use xvalente-1ddbd

# Deploy rules
echo "📋 Deploying Firestore rules..."
npx firebase deploy --only firestore:rules

# Deploy indexes
echo "📊 Deploying Firestore indexes..."
npx firebase deploy --only firestore:indexes

echo "✅ Deployment complete!"

