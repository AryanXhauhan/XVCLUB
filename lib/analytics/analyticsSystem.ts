
import { Order } from '@/lib/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export interface AnalyticsEvent {
  id?: string;
  eventType: EventType;
  userId?: string; // Optional, for authenticated users
  sessionId: string;
  orderId?: string; // If event is order-related
  productId?: string; // If event is product-related
  timestamp: Date;
  metadata: EventMetadata;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
}

export enum EventType {
  // Funnel Events
  PRODUCT_VIEWED = 'product_viewed',
  ADD_TO_CART = 'add_to_cart',
  CHECKOUT_STARTED = 'checkout_started',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  ORDER_COMPLETED = 'order_completed',
  
  // Revenue Events
  ORDER_REFUNDED = 'order_refunded',
  ORDER_CANCELLED = 'order_cancelled',
  
  // System Events
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended'
}

export interface EventMetadata {
  // Product events
  productCategory?: string;
  productPrice?: number;
  productName?: string;
  shade?: string;
  
  // Cart events
  cartValue?: number;
  cartItemCount?: number;
  cartItems?: CartItemData[];
  
  // Payment events
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentMethod?: string;
  failureReason?: string;
  razorpayOrderId?: string;
  
  // Order events
  orderValue?: number;
  orderStatus?: string;
  taxAmount?: number;
  shippingAmount?: number;
  
  // System events
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface CartItemData {
  productId: string;
  productName: string;
  shade?: string;
  quantity: number;
  price: number;
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

export interface RevenueMetrics {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  conversionRate: number;
  refundRate: number;
  cancellationRate: number;
}

export interface FunnelMetrics {
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  paymentInitiations: number;
  paymentSuccesses: number;
  dropOffRates: {
    viewToCart: number;
    cartToCheckout: number;
    checkoutToPayment: number;
    paymentToSuccess: number;
  };
}

export interface AnalyticsQuery {
  startDate: Date;
  endDate: Date;
  eventTypes?: EventType[];
  groupBy?: 'day' | 'week' | 'month';
  filters?: {
    deviceType?: DeviceType;
    productCategory?: string;
    currency?: string;
    country?: string;
  };
}

export class AnalyticsService {
  private eventsCollection = 'analytics_events';
  private metricsCollection = 'analytics_metrics';
  

  /**
   * Log analytics event to Firestore
   */
  async logEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = getFirestore();
      const eventData: AnalyticsEvent = {
        ...event,
        timestamp: new Date(),
        id: this.generateEventId()
      };

      // Use batched writes for better performance
      const batch = db.batch();
      const eventRef = db.collection(this.eventsCollection).doc();
      batch.set(eventRef, eventData);

      // Update real-time metrics
      await this.updateRealTimeMetrics(eventData);
      await batch.commit();
    } catch (error) {
      console.error('Failed to log analytics event:', error);
      // Don't throw - analytics failure shouldn't break main flow
    }
  }


  /**
   * Log product view event
   */
  async logProductView(productId: string, productName: string, category: string, sessionId: string, userId?: string): Promise<void> {
    try {
      // Only run on client side to avoid server-side errors
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      
      await this.logEvent({
        eventType: EventType.PRODUCT_VIEWED,
        userId,
        sessionId,
        productId,
        metadata: {
          productName,
          productCategory: category,
          pageUrl: window.location.href,
          referrer: document.referrer
        }
      });
    } catch (error) {
      console.error('Failed to log product view:', error);
      // Don't throw - analytics failure shouldn't break main flow
    }
  }


  /**
   * Log add to cart event
   */
  async logAddToCart(productId: string, productName: string, price: number, quantity: number, sessionId: string, userId?: string): Promise<void> {
    try {
      await this.logEvent({
        eventType: EventType.ADD_TO_CART,
        userId,
        sessionId,
        productId,
        metadata: {
          productName,
          productPrice: price,
          cartItemCount: quantity,
          pageUrl: typeof window !== 'undefined' ? window.location.href : ''
        }
      });
    } catch (error) {
      console.error('Failed to log add to cart:', error);
      // Don't throw - analytics failure shouldn't break main flow
    }
  }

  /**
   * Log checkout started event
   */
  async logCheckoutStarted(cartValue: number, cartItems: CartItemData[], sessionId: string, userId?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.CHECKOUT_STARTED,
      userId,
      sessionId,
      metadata: {
        cartValue,
        cartItemCount: cartItems.length,
        cartItems
      }
    });
  }

  /**
   * Log payment initiated event
   */
  async logPaymentInitiated(amount: number, currency: string, razorpayOrderId: string, sessionId: string, userId?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.PAYMENT_INITIATED,
      userId,
      sessionId,
      metadata: {
        paymentAmount: amount,
        paymentCurrency: currency,
        paymentMethod: 'razorpay',
        razorpayOrderId
      }
    });
  }

  /**
   * Log payment success event
   */
  async logPaymentSuccess(orderId: string, amount: number, currency: string, razorpayPaymentId: string, sessionId: string, userId?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.PAYMENT_SUCCESS,
      userId,
      sessionId,
      orderId,
      metadata: {
        paymentAmount: amount,
        paymentCurrency: currency,
        paymentMethod: 'razorpay',
        razorpayOrderId: razorpayPaymentId
      }
    });
  }

  /**
   * Log payment failed event
   */
  async logPaymentFailed(amount: number, currency: string, failureReason: string, sessionId: string, userId?: string): Promise<void> {
    await this.logEvent({
      eventType: EventType.PAYMENT_FAILED,
      userId,
      sessionId,
      metadata: {
        paymentAmount: amount,
        paymentCurrency: currency,
        paymentMethod: 'razorpay',
        failureReason
      }
    });
  }


  /**
   * Get revenue metrics for time period
   */
  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    try {
      const db = getFirestore();
      const ordersSnapshot = await db
        .collection('orders')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

      const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
      
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;



      // Calculate cancellation rates (refunded is a payment status, not order status)
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      

      const refundRate = 0; // Refunded is a payment status, not tracked in order status
      const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

      return {
        dailyRevenue: totalRevenue, // Will be filtered by date range
        weeklyRevenue: totalRevenue,
        monthlyRevenue: totalRevenue,
        averageOrderValue,
        totalOrders,
        conversionRate: await this.calculateConversionRate(startDate, endDate),
        refundRate,
        cancellationRate
      };
    } catch (error) {
      console.error('Failed to get revenue metrics:', error);
      throw error;
    }
  }


  /**
   * Get funnel metrics for time period
   */
  async getFunnelMetrics(startDate: Date, endDate: Date): Promise<FunnelMetrics> {
    try {
      const db = getFirestore();
      const eventsSnapshot = await db
        .collection(this.eventsCollection)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const events = eventsSnapshot.docs.map(doc => doc.data() as AnalyticsEvent);

      const productViews = events.filter(e => e.eventType === EventType.PRODUCT_VIEWED).length;
      const addToCarts = events.filter(e => e.eventType === EventType.ADD_TO_CART).length;
      const checkoutStarts = events.filter(e => e.eventType === EventType.CHECKOUT_STARTED).length;
      const paymentInitiations = events.filter(e => e.eventType === EventType.PAYMENT_INITIATED).length;
      const paymentSuccesses = events.filter(e => e.eventType === EventType.PAYMENT_SUCCESS).length;

      return {
        productViews,
        addToCarts,
        checkoutStarts,
        paymentInitiations,
        paymentSuccesses,
        dropOffRates: {
          viewToCart: productViews > 0 ? ((addToCarts / productViews) * 100) : 0,
          cartToCheckout: addToCarts > 0 ? ((checkoutStarts / addToCarts) * 100) : 0,
          checkoutToPayment: checkoutStarts > 0 ? ((paymentInitiations / checkoutStarts) * 100) : 0,
          paymentToSuccess: paymentInitiations > 0 ? ((paymentSuccesses / paymentInitiations) * 100) : 0
        }
      };
    } catch (error) {
      console.error('Failed to get funnel metrics:', error);
      throw error;
    }
  }


  /**
   * Get daily revenue for charts
   */
  async getDailyRevenue(startDate: Date, endDate: Date): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    try {
      const db = getFirestore();
      const ordersSnapshot = await db
        .collection('orders')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

      const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
      
      // Group by date
      const dailyData = new Map<string, { revenue: number; orders: number }>();
      
      orders.forEach(order => {
        const dateKey = order.createdAt.toDate().toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || { revenue: 0, orders: 0 };
        dailyData.set(dateKey, {
          revenue: existing.revenue + order.total,
          orders: existing.orders + 1
        });
      });

      return Array.from(dailyData.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Failed to get daily revenue:', error);
      throw error;
    }
  }


  /**
   * Calculate conversion rate
   */
  private async calculateConversionRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      const db = getFirestore();
      const productViewsSnapshot = await db
        .collection(this.eventsCollection)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .where('eventType', '==', EventType.PRODUCT_VIEWED)
        .get();

      const productViews = productViewsSnapshot.size;
      const ordersSnapshot = await db
        .collection('orders')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

      const orders = ordersSnapshot.size;

      return productViews > 0 ? (orders / productViews) * 100 : 0;
    } catch (error) {
      console.error('Failed to calculate conversion rate:', error);
      return 0;
    }
  }


  /**
   * Update real-time metrics (called for each event)
   */
  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    try {
      const db = getFirestore();
      const dateKey = event.timestamp.toISOString().split('T')[0];
      const metricsRef = db.collection(this.metricsCollection).doc(dateKey);
      
      const updateData: any = {};
      
      switch (event.eventType) {
        case EventType.PRODUCT_VIEWED:
          updateData.productViews = FieldValue.increment(1);
          break;
        case EventType.ADD_TO_CART:
          updateData.addToCarts = FieldValue.increment(1);
          break;
        case EventType.CHECKOUT_STARTED:
          updateData.checkoutStarts = FieldValue.increment(1);
          break;
        case EventType.PAYMENT_SUCCESS:
          updateData.paymentSuccesses = FieldValue.increment(1);
          updateData.revenue = FieldValue.increment(event.metadata.paymentAmount || 0);
          updateData.orders = FieldValue.increment(1);
          break;
        case EventType.PAYMENT_FAILED:
          updateData.paymentFailures = FieldValue.increment(1);
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await metricsRef.set({
          date: dateKey,
          ...updateData,
          lastUpdated: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }



}

// Export singleton instance
export const analyticsService = new AnalyticsService();
