# XVC Dropship Scaling Architecture Plan

## Executive Summary

This document outlines a battle-tested scaling strategy for XVC Dropship to handle 10,000+ orders/day while maintaining sub-5-second response times, zero data loss, and cost efficiency. The plan emphasizes incremental improvements over big-bang rewrites, with clear triggers for each scaling phase.

**Target Scale**: 10k+ orders/day, 5-10x traffic bursts during sales
**Zero Tolerance**: Data loss, payment failures, customer-facing errors
**Budget Focus**: Minimize infrastructure costs while maximizing reliability

---

## 🔄 Webhook Scalability

### Current State (0-1k orders/day)
- Synchronous webhook processing in Next.js API routes
- Single-threaded execution per webhook
- No queuing or backpressure handling

### Phase 1: Basic Resilience (1k-5k orders/day)
**Trigger**: >50 concurrent webhooks or >30s processing times

**Implementation**:
- **Immediate Response**: Return 200 OK within 5 seconds, process asynchronously
- **In-Memory Queue**: Use Redis for webhook buffering (free tier initially)
- **Exponential Backoff**: Razorpay retries every 30s for 24 hours

```typescript
// Webhook handler pattern
export async function POST(request: Request) {
  // Validate signature immediately (<1s)
  const isValid = await validateRazorpaySignature(request);

  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Queue for async processing
  await redis.lpush('webhook-queue', JSON.stringify(payload));

  // Respond immediately
  return Response.json({ status: 'accepted' });
}
```

**Cost**: $0-50/month (Redis free tier)
**Risk Reduction**: Eliminates webhook timeout failures

### Phase 2: Distributed Processing (5k-10k+ orders/day)
**Trigger**: Queue depth >1000 or processing latency >10s

**Implementation**:
- **Cloud Tasks/Cloud PubSub**: Replace Redis with managed queue
- **Horizontal Scaling**: Multiple webhook processors
- **Dead Letter Queue**: Failed webhooks for manual review

**Tradeoff**: Managed queues ($50-200/month) vs Redis complexity

---

## 🧱 Backend Architecture Evolution

### Current State
- Monolithic Next.js app with API routes
- Synchronous processing: Payment → Order → Shipping
- Single region deployment

### Phase 1: Service Boundaries (1k-5k orders/day)
**Trigger**: Webhook processing >5s consistently

**Implementation**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Webhook    │───▶│   Order     │───▶│  Shipping  │
│ Processor   │    │  Service    │    │  Service   │
│ (Next.js)   │    │ (Cloud Run) │    │ (Cloud Run)|
└─────────────┘    └─────────────┘    └─────────────┘
```

- **Order Service**: Handles Firestore writes, stock deduction
- **Shipping Service**: Manages Shiprocket API calls
- **Event-Driven**: PubSub between services

**Why Not Microservices Yet**: Team size (2-3 engineers), complexity cost

### Phase 2: Event-Driven Architecture (5k-10k+ orders/day)
**Trigger**: Cross-service failures or >10s end-to-end latency

**Implementation**:
- **Event Sourcing**: All state changes emit events
- **CQRS Pattern**: Separate read/write models
- **Saga Pattern**: Distributed transaction coordination

**Cost**: 2-3x infrastructure, but enables 10x scale

---

## 🗄️ Database & Stock Management at Scale

### Current State
- Firestore with atomic transactions
- Single document per order
- Basic stock deduction logic

### Phase 1: Hot Document Mitigation (1k-5k orders/day)
**Trigger**: Firestore throttling or >100 writes/second

**Implementation**:
```typescript
// Sharded stock management
const productRef = db.collection('products').doc(productId);
const stockRef = productRef.collection('stock').doc(shardId);

// Atomic decrement with sharding
await db.runTransaction(async (tx) => {
  const stockDoc = await tx.get(stockRef);
  const currentStock = stockDoc.data()?.quantity || 0;

  if (currentStock < quantity) {
    throw new Error('Insufficient stock');
  }

  tx.update(stockRef, {
    quantity: currentStock - quantity,
    lastUpdated: FieldValue.serverTimestamp()
  });
});
```

- **Stock Sharding**: Split inventory across multiple documents
- **Read Replicas**: Use Firestore for hot reads
- **Optimistic Locking**: Prevent concurrent modification conflicts

### Phase 2: Distributed Inventory (5k-10k+ orders/day)
**Trigger**: Stock inconsistency or >500 writes/second

**Implementation**:
- **Redis Cache**: Stock levels with TTL
- **Eventual Consistency**: Accept temporary overselling (<0.1%)
- **Reconciliation Jobs**: Hourly stock sync

**Tradeoff**: Eventual consistency vs immediate consistency
**Cost**: Redis ($50-200/month) vs Firestore scaling costs

---

## 🚚 Shiprocket API Scaling

### Current State
- Synchronous API calls
- 24-hour token caching
- No rate limit handling

### Phase 1: Rate Limit Management (1k-5k orders/day)
**Trigger**: Shiprocket API throttling or 429 errors

**Implementation**:
```typescript
class ShiprocketClient {
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  async enqueueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await request();

      // Rate limit: 1 request per 3.6 seconds (1000/hour)
      await new Promise(resolve => setTimeout(resolve, 3600));
    }

    this.processing = false;
  }
}
```

- **Request Queuing**: Serialize Shiprocket API calls
- **Circuit Breaker**: Fail fast during outages
- **Batch Creation**: Group orders for bulk shipment creation

### Phase 2: Multi-Account Distribution (5k-10k+ orders/day)
**Trigger**: Sustained 1000 orders/hour

**Implementation**:
- **Shiprocket Account Pool**: Multiple accounts for parallel processing
- **Load Balancing**: Distribute orders across accounts
- **Account Health Monitoring**: Automatic failover

**Cost**: Multiple Shiprocket accounts ($100-500/month each)

---

## ⚙️ Performance & Cost Optimization

### Current State
- Cold starts on Vercel/Netlify
- Synchronous processing
- No caching strategy

### Phase 1: Cold Start Mitigation (1k-5k orders/day)
**Trigger**: >3s webhook response times

**Implementation**:
- **Warm Functions**: Scheduled pings every 5 minutes
- **Connection Pooling**: Reuse database connections
- **Lazy Loading**: Defer non-critical operations

**Cost**: Minimal, mostly code changes

### Phase 2: Multi-Region Deployment (5k-10k+ orders/day)
**Trigger**: Regional outages or >5s global latency

**Implementation**:
- **Global Load Balancer**: Route traffic by geography
- **Read Replicas**: Global Firestore replication
- **CDN Integration**: Cache static assets

**Cost**: 2-3x infrastructure, but improves reliability

---

## 🔐 Security & Compliance at Scale

### Current State
- Basic webhook signature validation
- Environment variables for secrets
- No audit logging

### Phase 1: Production Security (1k-5k orders/day)
**Trigger**: Security audit or compliance requirements

**Implementation**:
- **Webhook Replay Protection**: Timestamp validation (<5min window)
- **Secrets Manager**: Replace env vars with Google Secret Manager
- **Audit Logging**: Structured logs for all financial operations

```typescript
// Audit logging pattern
const auditLog = {
  event: 'order_created',
  orderId: order.id,
  amount: order.total,
  userId: order.customerId,
  timestamp: new Date().toISOString(),
  ip: request.ip,
  userAgent: request.headers['user-agent']
};

await auditLogger.log(auditLog);
```

### Phase 2: Enterprise Compliance (5k-10k+ orders/day)
**Trigger**: PCI DSS or SOX requirements

**Implementation**:
- **End-to-End Encryption**: Customer data encryption
- **Access Control**: Role-based permissions
- **Data Retention**: Automated archival policies

---

## 📊 Observability & Operations

### Critical Metrics
```typescript
// Key metrics to monitor
const metrics = {
  // Performance
  webhookLatency: 'histogram', // Target: p95 <5s
  orderCreationTime: 'histogram', // Target: p95 <3s
  shippingCreationTime: 'histogram', // Target: p95 <10s

  // Reliability
  webhookSuccessRate: 'counter', // Target: >99.9%
  orderSuccessRate: 'counter', // Target: >99.5%
  shippingSuccessRate: 'counter', // Target: >95%

  // Business
  ordersPerHour: 'gauge',
  revenuePerHour: 'gauge',
  stockoutRate: 'gauge' // Target: <1%
};
```

### Alert Thresholds
- **P0 (Page immediately)**: Webhook success rate <99%, Payment failures >0
- **P1 (Page within 15min)**: Order creation rate <95%, Shipping failures >10%
- **P2 (Page within 1hr)**: Latency >10s, Stock inconsistencies

### Dashboard Requirements
- **Real-time**: Current order velocity, error rates
- **Historical**: Daily trends, peak analysis
- **Business**: Revenue tracking, conversion rates

---

## 🚨 Failure Scenarios & Recovery

### Partial Outages
**Razorpay Down**:
- Accept webhooks but mark as "payment_pending"
- Manual reconciliation when service recovers
- Customer notification: "Payment processing delayed"

**Shiprocket Down**:
- Orders complete successfully
- Shipping marked as "manual_required"
- Admin dashboard for bulk processing

**Firestore Outage**:
- Circuit breaker prevents cascading failures
- Queue webhooks for retry
- Fallback to Redis for critical state

### Incident Response Flow
1. **Detection**: Alerts trigger Slack notifications
2. **Assessment**: On-call engineer evaluates impact
3. **Communication**: Customer-facing status page update
4. **Recovery**: Execute runbook procedures
5. **Post-mortem**: Document root cause and improvements

### Manual Override Procedures
- **Emergency Shipping Disable**: Set `SHIPPING_MODE=manual`
- **Order Processing Pause**: Kill switch for webhook processing
- **Bulk Order Reprocessing**: Admin interface for failed orders

---

## 📈 Phased Scaling Roadmap

### Phase 0: Foundation (0-1k orders/day)
**Focus**: Stability over scale
- ✅ Idempotent webhooks
- ✅ Basic monitoring
- ✅ Manual shipping fallback
- ✅ Comprehensive testing

**Cost**: $50-200/month
**Timeline**: 1-2 weeks

### Phase 1: Resilience (1k-5k orders/day)
**Trigger**: Consistent >50 orders/hour
- 🔄 Async webhook processing
- 🗄️ Stock sharding
- 🚚 Shiprocket rate limiting
- 📊 Advanced monitoring

**Cost**: $200-500/month
**Timeline**: 2-4 weeks
**Risk**: Minimal, incremental changes

### Phase 2: Scale (5k-10k+ orders/day)
**Trigger**: Sustained 200+ orders/hour
- 🧱 Service decomposition
- 🌍 Multi-region deployment
- 🔐 Enterprise security
- 📈 Advanced analytics

**Cost**: $500-2000/month
**Timeline**: 4-8 weeks
**Risk**: Moderate, requires architecture changes

### Phase 3: Optimization (10k+ orders/day)
**Trigger**: Cost/reliability optimization needed
- 🎯 Auto-scaling
- 🤖 ML-based demand forecasting
- 🔄 Multi-cloud redundancy
- 📊 Predictive monitoring

**Cost**: $2000+/month
**Timeline**: 8-16 weeks

---

## Common Scaling Mistakes to Avoid

### ❌ Big Bang Rewrites
**Problem**: Attempting microservices migration at 1k orders/day
**Solution**: Incremental service extraction based on bottlenecks

### ❌ Over-Caching
**Problem**: Complex caching layers causing cache invalidation bugs
**Solution**: Start with database optimizations, add caching only when needed

### ❌ Ignoring Idempotency
**Problem**: Duplicate processing during failures
**Solution**: Design for at-least-once delivery from day one

### ❌ Reactive Scaling
**Problem**: Scaling up only after outages
**Solution**: Proactive monitoring with generous headroom

### ❌ Cost Optimization Before Reliability
**Problem**: Cutting corners on redundancy during growth
**Solution**: Reliability first, then optimize costs

---

## Implementation Checklist

### Immediate (Next Sprint)
- [ ] Add Redis for webhook queuing
- [ ] Implement async processing pattern
- [ ] Add comprehensive error monitoring
- [ ] Create incident response runbook

### Short-term (1-2 Months)
- [ ] Stock sharding implementation
- [ ] Shiprocket rate limiting
- [ ] Service boundary extraction
- [ ] Multi-region deployment planning

### Long-term (3-6 Months)
- [ ] Event-driven architecture
- [ ] Advanced security controls
- [ ] Predictive scaling
- [ ] Multi-cloud redundancy

---

**Document Version**: 1.0
**Last Updated**: January 2024
**Review Status**: Production Ready
**Business Impact**: Zero-downtime scaling to 10k+ orders/day
