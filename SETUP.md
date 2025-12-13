# XVC Platform - Manual Setup Guide

## 📋 Prerequisites
- Node.js 18+ installed
- Firebase account
- Stripe account
- Resend account (for emails)

---

## 🔥 Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Project name: `xvalente-1ddbd` (or your project name)
4. Enable Google Analytics (optional)

### 1.2 Enable Firestore Database
1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Start in **production mode** (we'll deploy rules later)
4. Choose location (closest to your users)
5. Click **Enable**

### 1.3 Enable Authentication
1. Go to **Authentication** in Firebase Console
2. Click **Get started**
3. Enable **Email/Password** provider
4. Click **Save**

### 1.4 Get Firebase Admin SDK Credentials
1. Go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click **Generate new private key**
4. Download the JSON file
5. **IMPORTANT**: Keep this file secure, never commit to git!

### 1.5 Deploy Firestore Security Rules
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Select your project
5. Deploy rules: `firebase deploy --only firestore:rules`

### 1.6 Deploy Firestore Indexes
1. Deploy indexes: `firebase deploy --only firestore:indexes`

---

## 💳 Step 2: Stripe Setup

### 2.1 Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or login
3. Complete account setup

### 2.2 Get API Keys
1. Go to **Developers** → **API keys**
2. Copy **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy **Secret key** (starts with `sk_test_` or `sk_live_`)
4. **Keep secret key secure!**

### 2.3 Set Up Webhook (After Deployment)
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select event: `checkout.session.completed`
5. Copy **Signing secret** (starts with `whsec_`)

---

## 📧 Step 3: Resend Setup (Email)

### 3.1 Create Resend Account
1. Go to [Resend](https://resend.com)
2. Sign up for free account
3. Verify your email

### 3.2 Get API Key
1. Go to **API Keys** section
2. Click **Create API Key**
3. Name it: `XVC Production`
4. Copy the API key (starts with `re_`)

### 3.3 Verify Domain (Optional, for production)
1. Go to **Domains**
2. Add your domain
3. Follow DNS verification steps

---

## ⚙️ Step 4: Environment Variables

### 4.1 Create `.env.local` File
Create a file named `.env.local` in the root directory:

```bash
# Firebase Client Configuration (Already in config.ts, but add here for production)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAn9FuaphPQ07nAl7DeqEbC_UI5-NxmLpc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xvalente-1ddbd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xvalente-1ddbd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xvalente-1ddbd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=469512655330
NEXT_PUBLIC_FIREBASE_APP_ID=1:469512655330:web:e518b15adf07569dab29bb

# Firebase Admin SDK (From downloaded JSON file)
FIREBASE_ADMIN_PROJECT_ID=xvalente-1ddbd
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@xvalente-1ddbd.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Resend Email Configuration
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=XVC <orders@xvc.com>

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# For production: NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4.2 How to Get Firebase Admin Private Key
1. Open the downloaded service account JSON file
2. Copy the `private_key` value (it's a long string)
3. Replace `\n` with actual newlines in `.env.local`
4. Keep the quotes around the entire key

**Example:**
```bash
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 Step 5: Install Dependencies & Run

### 5.1 Install Packages
```bash
npm install
```

### 5.2 Seed Products to Firestore
```bash
npx tsx scripts/seed-products.ts
```

This will populate your Firestore with the 3 hero products.

### 5.3 Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 👤 Step 6: Create Admin User

### 6.1 Create Admin Account in Firebase
1. Go to **Authentication** in Firebase Console
2. Click **Add user**
3. Enter email and password
4. Click **Add user**

### 6.2 Set Admin Custom Claim
1. Go to **Authentication** → **Users**
2. Find your admin user
3. Copy the **UID**
4. Run this script (create `scripts/set-admin.ts`):

```typescript
import { adminAuth } from '@/lib/firebase/admin';

const uid = 'YOUR_ADMIN_USER_UID';

adminAuth.setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Admin claim set successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
```

5. Run: `npx tsx scripts/set-admin.ts`

---

## 🧪 Step 7: Testing

### 7.1 Test Product Pages
- Visit `/lips`, `/eyes`, `/glow`
- Check if products are loading

### 7.2 Test Cart
- Add products to cart
- Check cart page
- Verify quantities update

### 7.3 Test Checkout Flow
1. Add items to cart
2. Go to checkout
3. Fill customer details
4. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
5. Verify order success page
6. Check admin dashboard for order

### 7.4 Test Admin Panel
1. Go to `/admin/login`
2. Login with admin credentials
3. Check orders dashboard
4. Test order status update

---

## 📦 Step 8: Production Deployment

### 8.1 Build for Production
```bash
npm run build
```

### 8.2 Deploy Options

**Option A: Vercel (Recommended)**
1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

**Option B: Firebase Hosting**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy --only hosting`

### 8.3 Update Environment Variables for Production
- Update `NEXT_PUBLIC_SITE_URL` to your production domain
- Use production Stripe keys
- Use production Resend API key
- Update Stripe webhook URL to production

### 8.4 Set Up Stripe Webhook in Production
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select event: `checkout.session.completed`
4. Copy webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in production env vars

---

## ✅ Pre-Launch Checklist

- [ ] All environment variables set
- [ ] Products seeded to Firestore
- [ ] Firestore security rules deployed
- [ ] Firestore indexes deployed
- [ ] Admin user created with custom claim
- [ ] Test purchase completed successfully
- [ ] Webhook tested (order created in Firestore)
- [ ] Email confirmation received
- [ ] Admin panel working (can view/update orders)
- [ ] Mobile responsive tested
- [ ] Return policy visible on all pages
- [ ] Production domain configured
- [ ] Stripe webhook configured for production
- [ ] SSL certificate active (HTTPS)

---

## 🆘 Troubleshooting

### Products Not Loading
- Check Firestore rules are deployed
- Verify products are seeded
- Check browser console for errors

### Admin Login Not Working
- Verify admin custom claim is set
- Check Firebase Auth is enabled
- Verify email/password provider is enabled

### Stripe Checkout Not Working
- Verify Stripe keys are correct
- Check API version compatibility
- Verify webhook secret is set

### Email Not Sending
- Check Resend API key
- Verify `RESEND_FROM_EMAIL` format
- Check Resend dashboard for errors

---

## 📞 Support

If you face any issues, check:
1. Browser console for errors
2. Server logs (terminal)
3. Firebase Console → Firestore → Usage
4. Stripe Dashboard → Logs
5. Resend Dashboard → Logs

---

**Good luck with your launch! 🚀**

