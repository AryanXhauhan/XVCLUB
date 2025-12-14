# Shiprocket Integration Documentation

## 🔄 How It Works

XVC Dropship implements a fully automated shipping workflow triggered by successful Razorpay payments:

1. **Customer completes payment** via Razorpay checkout
2. **Razorpay sends webhook** (`payment.captured`) to XVC backend
3. **Order is atomically created** in Firestore with stock deduction
4. **Shiprocket shipment is created** automatically via API
5. **Tracking information is saved** back to Firestore order document
6. **Customer receives confirmation email** with tracking details

**Critical**: Shipping failures do not block order completion. Failed shipments are logged and can be retried manually.

**⚠️ Production Warning**: Webhook processing must complete within 30 seconds to avoid Razorpay retries. Keep shipping operations asynchronous.

## 🧩 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Razorpay      │────│   Next.js API   │────│   Shiprocket    │
│   Payment       │    │   Webhook       │    │   API           │
│   Gateway       │    │   Handler       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   payment.captured      Order Creation +       Shipment Created
   webhook event         Stock Deduction         Tracking URL
```

### Key Components

- **Webhook Handler** (`app/api/webhooks/razorpay/route.ts`): Processes payment events
- **Shipping Service** (`lib/shipping/shiprocketIntegration.ts`): Manages Shiprocket API integration
- **Order Storage**: Firestore with atomic transactions
- **Email Service**: Automated customer notifications

## 🔐 Security Considerations

### Server-Side Only Architecture
- All Shiprocket API calls occur on the backend
- No API keys or tokens exposed to frontend
- Environment variables used for credential management

**⚠️ Critical**: Never log full API responses containing tokens or sensitive customer data.

### Authentication Security
- JWT tokens cached for 24 hours with 5-minute buffer
- Automatic token refresh on expiry
- Failed authentication clears cached tokens immediately

**⚠️ Production Risk**: Token caching reduces API calls but creates replay attack window. Monitor for unusual authentication patterns.

### Data Protection
- Customer PII handled securely in webhook processing
- Sensitive data not logged (only error messages)
- Input validation on all API payloads

**GDPR Compliance**: Implement data retention policies for order data. Customer shipping addresses should be encrypted at rest.

## ♻️ Idempotency Strategy

### Webhook Processing
- Razorpay order ID used as Firestore document ID
- Duplicate webhook events detected via existing order check
- Atomic transactions prevent race conditions

### Shipping Creation
- Order document checked for existing shipping information
- Duplicate shipment creation prevented at service level
- Failed shipments can be retried without duplication

### Implementation Details
```typescript
// Check for existing order
const orderRef = adminDb.collection('orders').doc(razorpayOrderId);
const orderSnap = await tx.get(orderRef);
if (orderSnap.exists) {
    alreadyProcessed = true;
    return;
}
```

## 🚨 Error Handling & Logging Strategy

### Error Isolation
- Shipping failures do not block order creation
- Payment processing continues regardless of shipping status
- Separate error logging for different system components

**Business Impact**: Customer gets order confirmation even if shipping fails. Manual fulfillment possible.

### Logging Levels
- **INFO**: Successful operations (auth, shipment creation)
- **WARN**: Recoverable errors (token refresh, temporary API issues)
- **ERROR**: Critical failures requiring attention

**Structured Logging**: Include correlation IDs for tracking requests across services.

### Error Recovery
- Automatic token refresh on authentication failures
- Retry logic for transient network issues (HTTP 5xx, timeouts)
- Manual intervention possible for permanent failures

**Circuit Breaker**: Implement for Shiprocket API to prevent cascade failures during outages.

### Monitoring Points
- Webhook receipt confirmation
- Order creation success/failure
- Shipping creation status
- Email delivery confirmation

**Alert Thresholds**:
- >5% shipping creation failures in 1 hour
- >10% webhook processing failures in 1 hour
- Any authentication failures (security incident)

## ⚙️ Environment Variables Setup

```env
# Required for Shiprocket integration
SHIPROCKET_EMAIL=your-email@shiprocket.in
SHIPROCKET_PASSWORD=your-password
SHIPPING_MODE=shiprocket

# Optional: Override default API endpoint
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external

# Required for Razorpay webhooks
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### Validation
- All required variables checked at startup
- Clear error messages for missing configuration
- No fallback defaults for security credentials

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] Shiprocket account verified and API access enabled
- [ ] Warehouse location configured in Shiprocket dashboard
- [ ] Razorpay webhook URL configured to production endpoint
- [ ] Environment variables set in production environment
- [ ] SSL certificate valid for webhook endpoint

### Testing
- [ ] Authentication test successful
- [ ] Manual order creation works in Shiprocket
- [ ] Webhook signature verification functional
- [ ] Email delivery confirmed

### Monitoring Setup
- [ ] Error logging configured (DataDog, Sentry, etc.)
- [ ] Alerting set up for failed shipments
- [ ] Dashboard monitoring for order processing metrics

### Rollback Plan
- [ ] `SHIPPING_MODE=manual` environment variable ready
- [ ] Manual shipping process documented
- [ ] Customer communication template prepared

## 🧪 Testing & Verification Steps

### Unit Testing
```bash
# Test authentication
npm test -- --testPathPattern=shiprocket

# Test order conversion
npm test -- --testPathPattern=convertOrder

# Test idempotency
npm test -- --testPathPattern=idempotency
```

**Coverage Requirements**: >90% code coverage including error paths.

### Integration Testing
1. **Environment Setup**: Verify all environment variables
2. **Authentication Test**: Confirm API token generation
3. **Order Creation Test**: Create test order in Shiprocket dashboard
4. **Webhook Test**: Use Razorpay dashboard to send test webhook
5. **End-to-End Test**: Complete payment flow with real payment
6. **Stock Deduction Test**: Verify atomic stock updates
7. **Duplicate Webhook Test**: Ensure idempotency works

**Chaos Testing**: Simulate Shiprocket API outages, network timeouts, Firestore failures.

### Verification Commands
```bash
# Check Shiprocket authentication
curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'

# Verify webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{...}}'

# Test idempotency (run twice)
curl -X POST https://your-domain.com/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{"order":{"id":"test-123"}}}'
```

**Performance Benchmark**: Webhook processing <5 seconds, authentication <2 seconds.

## 🛠 Troubleshooting Common Issues

### Authentication Problems
**Issue**: "Shiprocket credentials not configured"
**Solution**: Verify `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` environment variables

**Issue**: "Authentication failed: 401"
**Solution**: Check Shiprocket dashboard credentials and account status

### Order Creation Failures
**Issue**: "HTTP 400: Invalid order data"
**Solution**:
- Verify order payload structure
- Check required fields (customer details, shipping address)
- Confirm product data format

**Issue**: "Order already exists"
**Solution**: This is normal idempotency behavior, not an error

### Webhook Issues
**Issue**: Webhooks not being received
**Solution**:
- Verify webhook URL in Razorpay dashboard
- Check SSL certificate validity
- Confirm webhook secret matches

**Issue**: Webhook signature verification fails
**Solution**: Ensure `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard

### Shipping Integration Problems
**Issue**: Shipments not being created
**Solution**:
- Check `SHIPPING_MODE` environment variable
- Verify Shiprocket API connectivity
- Review server logs for detailed error messages

## 🎯 Next Steps & Scaling Suggestions

### Immediate Improvements (Week 1-2)
- Implement shipment status webhooks from Shiprocket for real-time tracking updates
- Add automated retry logic for failed shipments (exponential backoff)
- Create admin dashboard for manual shipment management and order reconciliation
- Add structured logging with correlation IDs across all services

### Scaling Considerations (Month 1-3)
- Implement rate limiting for Shiprocket API calls (respect 1000/hour limit)
- Add circuit breaker pattern for API failures to prevent cascade outages
- Consider Shiprocket's bulk order creation for high volume (>100 orders/hour)
- Implement horizontal scaling for webhook processing

### Monitoring Enhancements (Ongoing)
- Set up alerts for shipment creation failures (>5% failure rate)
- Track delivery performance metrics (OTD, customer satisfaction)
- Implement order processing latency monitoring (<5s target)
- Add business metrics: conversion rate, average order value, shipping costs

### Future Integrations (Month 3+)
- Connect with multiple courier partners for cost optimization
- Implement automated return processing and reverse logistics
- Add shipment tracking updates via email/SMS notifications
- Integrate with inventory management systems for real-time stock sync

### Risk Mitigation
- Implement data backup and disaster recovery procedures
- Set up multi-region deployment for high availability
- Create incident response playbooks for shipping outages
- Establish vendor management processes for Shiprocket relationship

---

**Document Version**: 1.1
**Last Updated**: January 2024
**System**: XVC Dropship Ecommerce Platform
**Review Status**: Production Ready
