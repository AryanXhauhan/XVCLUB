# Firebase Setup & Deployment Guide

## ⚠️ Important: Run these commands in your terminal (not through AI)

Since Firebase commands require interactive login, you need to run them manually in your terminal.

## Step 1: Install Firebase Tools (Global)

**Option A: With sudo (if you have admin access)**
```bash
sudo npm install -g firebase-tools
```

**Option B: Use npx (no global install needed)**
```bash
# Already installed locally, just use npx
npx firebase --version
```

## Step 2: Firebase Login

```bash
# If installed globally:
firebase login

# If using npx:
npx firebase login
```

This will:
- Open your browser
- Ask you to authenticate with Google
- Grant Firebase CLI access

## Step 3: Initialize Firestore (Optional - Already Done)

**Note:** We already have `firebase.json`, `firestore.rules`, and `firestore.indexes.json` files configured. 

If you want to re-initialize:
```bash
# If installed globally:
firebase init firestore

# If using npx:
npx firebase init firestore
```

**When prompted:**
- ✅ Use existing `firestore.rules` file? → **Yes**
- ✅ Use existing `firestore.indexes.json` file? → **Yes**
- Select project: **xvalente-1ddbd**

## Step 4: Set Firebase Project

```bash
npx firebase use xvalente-1ddbd
```

## Step 5: Deploy Firestore Rules & Indexes

```bash
# Deploy rules
npx firebase deploy --only firestore:rules

# Deploy indexes
npx firebase deploy --only firestore:indexes

# Or both together:
npx firebase deploy --only firestore:rules,firestore:indexes
```

## Quick Commands Summary

```bash
# 1. Login (first time only)
npx firebase login

# 2. Set project
npx firebase use xvalente-1ddbd

# 3. Deploy everything
npx firebase deploy --only firestore:rules,firestore:indexes
```

## Files Already Configured

✅ `firebase.json` - Firebase configuration
✅ `firestore.rules` - Security rules (products public read, orders webhook-only)
✅ `firestore.indexes.json` - Database indexes

## Troubleshooting

**If login fails:**
- Make sure you're using the correct Google account
- Check if you have access to the Firebase project

**If deploy fails:**
- Verify you're logged in: `npx firebase login:list`
- Check project: `npx firebase projects:list`
- Verify project ID: `npx firebase use`

**Permission errors:**
- Use `npx firebase-tools` instead of global install
- Or use `sudo` for global install (macOS/Linux)

---

**Ready to deploy?** Run the commands in your terminal! 🚀

