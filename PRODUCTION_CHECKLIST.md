# Production Environment Checklist

## 🔐 Required Environment Variables

### Firebase Configuration
```bash
# Firebase Web App (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

### Stripe Configuration (if applicable)
```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Webhook URL (in Stripe Dashboard)
https://yourdomain.com/api/webhooks/stripe
```

### Next.js Configuration
```bash
# Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Environment
NODE_ENV=production
```

## 🚀 Platform-Specific Setup

### Vercel Deployment

1. **Go to Vercel Dashboard**
   - Import your GitHub repository
   - Go to Project Settings > Environment Variables

2. **Add Environment Variables**
   ```bash
   # Add all variables listed above
   # Ensure FIREBASE_PRIVATE_KEY has proper newlines (\n)
   ```

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Domain Configuration**
   - Add your custom domain in Project Settings > Domains
   - Update Firebase authorized domains
   - Update Stripe webhook URLs

### Netlify Deployment

1. **Go to Netlify Dashboard**
   - New site from Git
   - Select your repository

2. **Build Settings**
   ```bash
   Build command: npm run build
   Publish directory: .next
   ```

3. **Environment Variables**
   - Site Settings > Environment Variables
   - Add all variables listed above

4. **netlify.toml Configuration**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

## ⚠️ Common Production Mistakes to Avoid

### 1. Environment Variables
- ❌ **DON'T** commit `.env.local` to version control
- ❌ **DON'T** use development keys in production
- ✅ **DO** use different Firebase projects for dev/prod
- ✅ **DO** ensure `FIREBASE_PRIVATE_KEY` has proper newlines

### 2. Firebase Configuration
- ❌ **DON'T** use development `apiKey` in production
- ❌ **DON'T** forget to add production domain to authorized domains
- ✅ **DO** create separate Firebase projects for staging/production
- ✅ **DO** use environment-specific Firebase configs

### 3. Security Rules
- ❌ **DON'T** deploy rules without testing
- ❌ **DON'T** allow public write access to sensitive data
- ✅ **DO** test rules thoroughly in Firebase Console
- ✅ **DO** use proper validation in Firestore rules

### 4. Authentication
- ❌ **DON'T** expose admin functionality to regular users
- ❌ **DON'T** trust client-side auth checks alone
- ✅ **DO** use middleware for route protection
- ✅ **DO** verify tokens server-side

### 5. Deployment
- ❌ **DON'T** deploy without testing in staging first
- ❌ **DON'T** forget to update webhook URLs
- ✅ **DO** test thoroughly in staging environment
- ✅ **DO** monitor deployment logs

### 6. Monitoring
- ❌ **DON'T** skip error monitoring setup
- ❌ **DON'T** ignore Firebase usage quotas
- ✅ **DO** set up error tracking (Sentry, LogRocket)
- ✅ **DO** monitor Firebase Console for unusual activity

## 🔒 Security Checklist

- [ ] Environment variables are secured (not in repo)
- [ ] Firebase rules prevent unauthorized access
- [ ] Admin routes are protected by middleware
- [ ] Session cookies are HTTP-only and secure
- [ ] HTTPS is enforced (redirect HTTP to HTTPS)
- [ ] API endpoints validate authentication
- [ ] Admin claims are set server-side only
- [ ] Webhook signatures are verified
- [ ] Sensitive data is encrypted
- [ ] CORS is properly configured

## 📊 Monitoring Setup

### Firebase Console
- Monitor authentication usage
- Check Firestore usage and quotas
- Review security rules violations
- Monitor Cloud Functions (if used)

### Application Monitoring
- Set up error tracking
- Monitor performance metrics
- Track user authentication patterns
- Monitor admin access logs

## 🚨 Emergency Procedures

### If Admin Access is Compromised
1. Revoke all admin custom claims immediately
2. Reset Firebase Admin credentials
3. Review audit logs for suspicious activity
4. Update security rules if needed
5. Notify all legitimate admin users

### If Data Breach is Suspected
1. Check Firebase security rules
2. Review access logs
3. Identify affected users/data
4. Implement additional security measures
5. Follow compliance requirements

## 📝 Testing Checklist

Before going live:
- [ ] Test admin login flow
- [ ] Verify middleware protection
- [ ] Test Firestore security rules
- [ ] Test session cookie expiration
- [ ] Verify webhook functionality
- [ ] Test error handling
- [ ] Test on mobile devices
- [ ] Test with slow internet connections
- [ ] Test admin logout functionality
- [ ] Verify HTTPS enforcement
