# 🚀 XVC ECOMMERCE LAUNCH CHECKLIST
**LIVE BRAND LAUNCH - PRODUCTION GRADE**

## 📋 **PRE-LAUNCH CHECKLIST (T-24 Hours)**

### **Environment & Security**
- [ ] ✅ All required env vars present in production:
  - [ ] `RAZORPAY_KEY_ID` (live keys)
  - [ ] `RAZORPAY_KEY_SECRET` (live keys)
  - [ ] `RAZORPAY_WEBHOOK_SECRET` (live keys)
  - [ ] `RESEND_API_KEY` (production domain)
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] ✅ Firestore rules deployed and active
- [ ] ✅ Netlify build successful with production config
- [ ] ✅ All console.logs removed from production code

### **Payment Gateway**
- [ ] ✅ Razorpay account switched to LIVE mode
- [ ] ✅ Webhook URL configured: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] ✅ Webhook secret matches environment variable
- [ ] ✅ Test Razorpay API connectivity
- [ ] ✅ International cards enabled in Razorpay dashboard
- [ ] ✅ USD currency enabled (if supporting international)

### **Admin System**
- [ ] ✅ Admin user created with proper custom claims
- [ ] ✅ Admin authentication flow tested
- [ ] ✅ Order management system accessible
- [ ] ✅ Product management accessible
- [ ] ✅ Inventory updates working

### **Email System**
- [ ] ✅ Resend domain verified and active
- [ ] ✅ Order confirmation email template tested
- [ ] ✅ Admin notification email configured
- [ ] ✅ SMTP backup configured (if using)

### **Database**
- [ ] ✅ Products seeded with correct pricing (INR + USD)
- [ ] ✅ Stock levels verified
- [ ] ✅ Active products marked correctly
- [ ] ✅ Firestore indexes created (if needed)

## 🎯 **LAUNCH-DAY CHECKLIST (T-0)**

### **First Transaction Test (₹1)**
- [ ] ✅ Create test order with ₹1 product
- [ ] ✅ Complete payment with Razorpay test card
- [ ] ✅ Verify webhook fires successfully
- [ ] ✅ Confirm order created in Firestore
- [ ] ✅ Verify stock decremented correctly
- [ ] ✅ Check order confirmation email received
- [ ] ✅ Verify invoice generated

### **Payment Failure Test**
- [ ] ✅ Test declined payment scenario
- [ ] ✅ Verify no order created on failure
- [ ] ✅ Check error handling in frontend
- [ ] ✅ Verify customer sees proper error message

### **Webhook Retry Test**
- [ ] ✅ Simulate webhook failure
- [ ] ✅ Verify Razorpay retry mechanism
- [ ] ✅ Check webhook logs in Razorpay dashboard
- [ ] ✅ Confirm eventual success

### **Inventory Test**
- [ ] ✅ Test multiple orders for same product
- [ ] ✅ Verify stock never goes negative
- [ ] ✅ Test out-of-stock scenario
- [ ] ✅ Check product availability updates

### **Email System Test**
- [ ] ✅ Order confirmation email delivery
- [ ] ✅ Admin notification email delivery
- [ ] ✅ Invoice PDF attachment working
- [ ] ✅ Email templates render correctly

## 📊 **POST-LAUNCH MONITORING (T+1 Hour)**

### **Order Monitoring**
- [ ] ✅ Check Firestore orders collection
- [ ] ✅ Monitor Razorpay dashboard for transactions
- [ ] ✅ Verify webhook delivery success rate
- [ ] ✅ Check error logs in Netlify

### **Performance Monitoring**
- [ ] ✅ Page load times acceptable
- [ ] ✅ Checkout flow smooth
- [ ] ✅ No JavaScript errors in browser console
- [ ] ✅ Mobile responsiveness verified

### **Financial Monitoring**
- [ ] ✅ Razorpay settlement settings correct
- [ ] ✅ GST calculations accurate
- [ ] ✅ Invoice generation working
- [ ] ✅ Tax reporting setup

## 🚨 **EMERGENCY ROLLBACK PROCEDURES**

### **Payment Issues**
- [ ] 🔄 Switch Razorpay to TEST mode (if critical)
- [ ] 🔄 Disable new orders temporarily
- [ ] 🔄 Notify customers of maintenance

### **Webhook Failures**
- [ ] 🔄 Check webhook URL accessibility
- [ ] 🔄 Verify webhook secret
- [ ] 🔄 Test manual webhook trigger
- [ ] 🔄 Contact Razorpay support if needed

### **Database Issues**
- [ ] 🔄 Check Firestore quota limits
- [ ] 🔄 Verify security rules haven't changed
- [ ] 🔄 Test read/write operations
- [ ] 🔄 Backup data if needed

### **Email Failures**
- [ ] 🔄 Check Resend API status
- [ ] 🔄 Verify domain settings
- [ ] 🔄 Switch to SMTP backup
- [ ] 🔄 Manual email sending as backup

## ✅ **LAUNCH SUCCESS CRITERIA**

- [ ] ✅ First real payment processed successfully
- [ ] ✅ Order confirmation email delivered
- [ ] ✅ Admin notified of new order
- [ ] ✅ Stock decremented correctly
- [ ] ✅ Invoice generated and sent
- [ ] ✅ No critical errors in logs
- [ ] ✅ Customer can track order status

## 📞 **EMERGENCY CONTACTS**

- **Razorpay Support:** support@razorpay.com
- **Netlify Support:** support@netlify.com
- **Firebase Support:** Firebase Console → Support
- **Resend Support:** support@resend.com

---

**🚀 LAUNCH STATUS: READY FOR LIVE CUSTOMERS**
