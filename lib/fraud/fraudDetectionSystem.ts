
import { Order } from '@/lib/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export interface FraudFlag {
  id?: string;
  orderId: string;
  userId?: string;
  ipAddress?: string;
  email?: string;
  flagType: FraudFlagType;
  severity: FraudSeverity;
  score: number; // 0-100, higher = more suspicious
  triggeredRules: string[];
  metadata: FraudMetadata;
  status: FraudStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  falsePositive?: boolean;
}

export enum FraudFlagType {
  REPEATED_FAILED_PAYMENTS = 'repeated_failed_payments',
  MULTIPLE_ORDERS_SAME_IP = 'multiple_orders_same_ip',
  MULTIPLE_ORDERS_SAME_EMAIL = 'multiple_orders_same_email',
  HIGH_VALUE_NEW_USER = 'high_value_new_user',
  RAPID_CHECKOUT_ATTEMPTS = 'rapid_checkout_attempts',
  WEBHOOK_REPLAY_ATTACK = 'webhook_replay_attack',
  STOCK_DRAINING_ATTACK = 'stock_draining_attack',
  SUSPICIOUS_BILLING_PATTERN = 'suspicious_billing_pattern',
  FOREIGN_PAYMENT_PATTERN = 'foreign_payment_pattern',
  VELOCITY_ANOMALY = 'velocity_anomaly'
}

export enum FraudSeverity {
  LOW = 'low',      // 0-25: Monitor
  MEDIUM = 'medium', // 26-50: Flag for review
  HIGH = 'high',    // 51-75: Hold order
  CRITICAL = 'critical' // 76-100: Block immediately
}

export enum FraudStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FALSE_POSITIVE = 'false_positive'
}



export interface FraudMetadata {

  paymentFailureCount?: number;
  paymentFailureWindow?: number; // minutes
  razorpayOrderId?: string;
  paymentMethod?: string;
  
  // Order-related
  orderValue?: number;
  orderCount?: number;
  orderWindow?: number; // minutes
  newUserOrderCount?: number;
  
  // IP-related
  ipAddress?: string;
  ipCountry?: string;
  ipRiskScore?: number;
  
  // Email-related
  emailDomain?: string;
  emailRiskScore?: number;
  
  // Shipping-related
  shippingAddress?: string;
  billingAddress?: string;
  addressMismatch?: boolean;
  
  // System-related
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  
  // Stock-related
  stockDepletion?: number;
  targetProductIds?: string[];
}
export interface FraudRule {
  id: string;
  name: string;
  type: FraudFlagType;
  description: string;
  enabled: boolean;
  severity: FraudSeverity;
  score: number;
  conditions: FraudCondition[];
  actions: FraudAction[];
  cooldownMinutes?: number;
  maxTriggersPerHour?: number;
}

export interface FraudCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists';
  value: any;
  timeWindow?: number; // minutes
}

export interface FraudAction {
  type: 'flag_order' | 'hold_order' | 'block_order' | 'send_alert' | 'require_manual_review';
  parameters?: Record<string, any>;
}


export interface FraudContext {
  order?: Order;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  recentOrders?: Order[];
  paymentFailures?: number;
  userId?: string;
  email?: string;
  metadata?: any;
}

export class FraudDetectionService {
  private fraudFlagsCollection = 'fraud_flags';
  private fraudRulesCollection = 'fraud_rules';
  
  // Fraud rules configuration
  private static readonly FRAUD_RULES: FraudRule[] = [
    {
      id: 'repeated_failed_payments',
      name: 'Repeated Failed Payments',
      type: FraudFlagType.REPEATED_FAILED_PAYMENTS,
      description: 'Customer has multiple failed payments within a short time window',
      enabled: true,
      severity: FraudSeverity.HIGH,
      score: 75,
      conditions: [
        { field: 'paymentFailureCount', operator: 'greater_than', value: 2, timeWindow: 60 },
        { field: 'paymentFailureWindow', operator: 'less_than', value: 60 }
      ],
      actions: [
        { type: 'flag_order' },
        { type: 'send_alert', parameters: { severity: 'high' } }
      ],
      cooldownMinutes: 30,
      maxTriggersPerHour: 3
    },
    
    {
      id: 'multiple_orders_same_ip',
      name: 'Multiple Orders from Same IP',
      type: FraudFlagType.MULTIPLE_ORDERS_SAME_IP,
      description: 'Multiple orders from the same IP address in a short time',
      enabled: true,
      severity: FraudSeverity.MEDIUM,
      score: 50,
      conditions: [
        { field: 'orderCount', operator: 'greater_than', value: 3, timeWindow: 120 },
        { field: 'ipAddress', operator: 'exists', value: true }
      ],
      actions: [
        { type: 'flag_order' }
      ],
      cooldownMinutes: 60,
      maxTriggersPerHour: 5
    },
    
    {
      id: 'multiple_orders_same_email',
      name: 'Multiple Orders from Same Email',
      type: FraudFlagType.MULTIPLE_ORDERS_SAME_EMAIL,
      description: 'Multiple orders from the same email address',
      enabled: true,
      severity: FraudSeverity.MEDIUM,
      score: 40,
      conditions: [
        { field: 'orderCount', operator: 'greater_than', value: 5, timeWindow: 1440 },
        { field: 'email', operator: 'exists', value: true }
      ],
      actions: [
        { type: 'flag_order' }
      ],
      cooldownMinutes: 120,
      maxTriggersPerHour: 2
    },
    
    {
      id: 'high_value_new_user',
      name: 'High Value Order from New User',
      type: FraudFlagType.HIGH_VALUE_NEW_USER,
      description: 'High value order from a new customer (no previous orders)',
      enabled: true,
      severity: FraudSeverity.HIGH,
      score: 80,
      conditions: [
        { field: 'orderValue', operator: 'greater_than', value: 10000 },
        { field: 'newUserOrderCount', operator: 'equals', value: 1 }
      ],
      actions: [
        { type: 'require_manual_review' },
        { type: 'send_alert', parameters: { severity: 'high' } }
      ],
      cooldownMinutes: 240
    },
    
    {
      id: 'rapid_checkout_attempts',
      name: 'Rapid Checkout Attempts',
      type: FraudFlagType.RAPID_CHECKOUT_ATTEMPTS,
      description: 'Multiple checkout attempts in a short time window',
      enabled: true,
      severity: FraudSeverity.MEDIUM,
      score: 60,
      conditions: [
        { field: 'orderCount', operator: 'greater_than', value: 2, timeWindow: 15 },
        { field: 'orderWindow', operator: 'less_than', value: 15 }
      ],
      actions: [
        { type: 'flag_order' }
      ],
      cooldownMinutes: 30,
      maxTriggersPerHour: 10
    },
    
    {
      id: 'webhook_replay_attack',
      name: 'Webhook Replay Attack',
      type: FraudFlagType.WEBHOOK_REPLAY_ATTACK,
      description: 'Duplicate webhook with same Razorpay payment ID',
      enabled: true,
      severity: FraudSeverity.CRITICAL,
      score: 95,
      conditions: [
        { field: 'razorpayOrderId', operator: 'exists', value: true }
      ],
      actions: [
        { type: 'block_order' },
        { type: 'send_alert', parameters: { severity: 'critical' } }
      ]
    },
    
    {
      id: 'stock_draining_attack',
      name: 'Stock Draining Attack',
      type: FraudFlagType.STOCK_DRAINING_ATTACK,
      description: 'Attempt to purchase large quantities of limited stock',
      enabled: true,
      severity: FraudSeverity.HIGH,
      score: 85,
      conditions: [
        { field: 'stockDepletion', operator: 'greater_than', value: 0.8 },
        { field: 'orderValue', operator: 'greater_than', value: 5000 }
      ],
      actions: [
        { type: 'require_manual_review' },
        { type: 'send_alert', parameters: { severity: 'high' } }
      ]
    },
    
    {
      id: 'foreign_payment_pattern',
      name: 'Foreign Payment Pattern',
      type: FraudFlagType.FOREIGN_PAYMENT_PATTERN,
      description: 'Payments from countries with high fraud rates',
      enabled: true,
      severity: FraudSeverity.MEDIUM,
      score: 55,
      conditions: [
        { field: 'ipCountry', operator: 'in', value: ['NG', 'UA', 'RU', 'PK', 'BD', 'VN'] }
      ],
      actions: [
        { type: 'flag_order' }
      ],
      cooldownMinutes: 60
    },
    
    {
      id: 'velocity_anomaly',
      name: 'Velocity Anomaly',
      type: FraudFlagType.VELOCITY_ANOMALY,
      description: 'Unusual order velocity compared to historical patterns',
      enabled: true,
      severity: FraudSeverity.MEDIUM,
      score: 65,
      conditions: [
        { field: 'orderCount', operator: 'greater_than', value: 2, timeWindow: 30 }
      ],
      actions: [
        { type: 'flag_order' }
      ],
      cooldownMinutes: 45,
      maxTriggersPerHour: 4
    }
  ];

  /**
   * Evaluate fraud rules for an order
   */
  async evaluateFraudRisk(context: FraudContext): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = [];
    const db = getFirestore();
    
    try {
      // Get historical data for context
      const historicalData = await this.getHistoricalData(context);
      const enrichedContext = { ...context, ...historicalData };
      

      // Check each fraud rule
      for (const rule of FraudDetectionService.FRAUD_RULES) {
        if (!rule.enabled) continue;
        
        const shouldTrigger = await this.evaluateRule(rule, enrichedContext);
        
        if (shouldTrigger) {
          const flag = await this.createFraudFlag(rule, enrichedContext);
          flags.push(flag);
          
          // Execute rule actions
          await this.executeRuleActions(rule, flag, enrichedContext);
        }
      }
      
      // Log fraud detection attempt
      await this.logFraudEvaluation(enrichedContext, flags);
      
      return flags;
    } catch (error) {
      console.error('Fraud evaluation error:', error);
      return [];
    }
  }

  /**
   * Evaluate a specific fraud rule
   */
  private async evaluateRule(rule: FraudRule, context: FraudContext): Promise<boolean> {
    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(context, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition)) {
        return false;
      }
    }
    
    // Check cooldown and rate limits
    if (await this.isInCooldown(rule.id, context)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get field value from context
   */
  private getFieldValue(context: FraudContext, field: string): any {
    const fieldMap: Record<string, any> = {
      'paymentFailureCount': context.paymentFailures || 0,
      'orderCount': context.recentOrders?.length || 0,
      'orderValue': context.order?.total || 0,
      'newUserOrderCount': context.recentOrders?.length === 0 ? 1 : 0,
      'ipAddress': context.ipAddress,
      'email': context.email,
      'razorpayOrderId': context.order?.razorpayOrderId,
      'ipCountry': context.metadata?.ipCountry,
      'stockDepletion': this.calculateStockDepletion(context.order),
      'orderWindow': this.calculateOrderWindow(context.recentOrders),
      'paymentFailureWindow': this.calculatePaymentFailureWindow(context.recentOrders)
    };
    
    return fieldMap[field];
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(fieldValue: any, condition: FraudCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  /**
   * Create fraud flag in Firestore
   */
  private async createFraudFlag(rule: FraudRule, context: FraudContext): Promise<FraudFlag> {
    const db = getFirestore();
    const flagId = this.generateFlagId();
    
    const flag: FraudFlag = {
      id: flagId,
      orderId: context.order?.id || 'unknown',
      userId: context.userId,
      ipAddress: context.ipAddress,
      email: context.email,
      flagType: rule.type,
      severity: rule.severity,
      score: rule.score,
      triggeredRules: [rule.id],
      metadata: this.buildFraudMetadata(context),
      status: this.getInitialStatus(rule.severity),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(this.fraudFlagsCollection).doc(flagId).set(flag);
    
    return flag;
  }

  /**
   * Execute rule actions
   */
  private async executeRuleActions(rule: FraudRule, flag: FraudFlag, context: FraudContext): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'flag_order':
          // Flag is already created, no additional action needed
          break;
        case 'hold_order':
          await this.holdOrder(context.order?.id, flag.id);
          break;
        case 'block_order':
          await this.blockOrder(context.order?.id, flag.id);
          break;
        case 'send_alert':
          await this.sendFraudAlert(flag, action.parameters);
          break;

        case 'require_manual_review':
          if (flag.id) {
            await this.markForManualReview(flag.id);
          }
          break;
      }
    }
  }

  /**
   * Get historical data for fraud analysis
   */
  private async getHistoricalData(context: FraudContext): Promise<any> {
    const db = getFirestore();
    const historicalData: any = {};
    
    try {

      // Get recent orders for the user
      if (context.userId || context.email) {
        let query = db.collection('orders') as any;
        
        if (context.userId) {
          query = query.where('userId', '==', context.userId);
        } else if (context.email) {
          query = query.where('customerEmail', '==', context.email);
        }
        
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24); // Last 24 hours
        
        const ordersSnapshot = await query
          .where('createdAt', '>=', cutoffDate)
          .get();
        

        historicalData.recentOrders = ordersSnapshot.docs.map((doc: any) => doc.data() as Order);
      }
      


      // Get payment failures
      if (context.ipAddress || context.userId || context.email) {
        let failureQuery = db.collection('payment_failures') as any;
        
        if (context.ipAddress) {
          failureQuery = failureQuery.where('ipAddress', '==', context.ipAddress);
        }
        
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 1); // Last hour
        
        const failuresSnapshot = await failureQuery
          .where('createdAt', '>=', cutoffDate)
          .get();
        
        historicalData.paymentFailures = failuresSnapshot.size;
      }
      
      return historicalData;
    } catch (error) {
      console.error('Failed to get historical data:', error);
      return {};
    }
  }


  /**
   * Check if rule is in cooldown
   */
  private async isInCooldown(ruleId: string, context: FraudContext): Promise<boolean> {
    const db = getFirestore();
    
    // Check recent flags for this rule and context
    let query = db.collection(this.fraudFlagsCollection)
      .where('triggeredRules', 'array-contains', ruleId) as any;
    
    if (context.ipAddress) {
      query = query.where('ipAddress', '==', context.ipAddress);
    } else if (context.email) {
      query = query.where('email', '==', context.email);
    } else if (context.userId) {
      query = query.where('userId', '==', context.userId);
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - 60); // 1 hour ago
    
    const snapshot = await query
      .where('createdAt', '>=', cutoffDate)
      .get();
    
    return snapshot.size > 0;
  }

  /**
   * Calculate stock depletion percentage
   */
  private calculateStockDepletion(order?: Order): number {
    if (!order?.items) return 0;
    
    // This would need product stock data to calculate properly
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Calculate time window between orders
   */
  private calculateOrderWindow(orders?: Order[]): number {
    if (!orders || orders.length < 2) return 0;
    
    const sortedOrders = orders.sort((a, b) => 
      a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime()
    );
    
    const latest = sortedOrders[sortedOrders.length - 1];
    const previous = sortedOrders[sortedOrders.length - 2];
    
    return (latest.createdAt.toDate().getTime() - previous.createdAt.toDate().getTime()) / (1000 * 60);
  }

  /**
   * Calculate payment failure window
   */
  private calculatePaymentFailureWindow(orders?: Order[]): number {
    // This would need payment failure data
    return 0;
  }



  /**
   * Build fraud metadata
   */
  private buildFraudMetadata(context: FraudContext): FraudMetadata {
    return {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      emailDomain: context.email?.split('@')[1],
      orderValue: context.order?.total,
      orderCount: context.recentOrders?.length,
      razorpayOrderId: context.order?.razorpayOrderId,
      paymentFailureCount: context.paymentFailures,
      shippingAddress: context.order?.shippingAddress ? 
        `${context.order.shippingAddress.city}, ${context.order.shippingAddress.country}` : undefined,
      billingAddress: context.order?.billingAddress ?
        `${context.order.billingAddress.city}, ${context.order.billingAddress.country}` : undefined
    };
  }

  /**
   * Get initial status based on severity
   */
  private getInitialStatus(severity: FraudSeverity): FraudStatus {
    switch (severity) {
      case FraudSeverity.CRITICAL:
        return FraudStatus.UNDER_REVIEW;
      case FraudSeverity.HIGH:
        return FraudStatus.UNDER_REVIEW;
      case FraudSeverity.MEDIUM:
        return FraudStatus.PENDING;
      case FraudSeverity.LOW:
        return FraudStatus.PENDING;
      default:
        return FraudStatus.PENDING;
    }
  }

  /**
   * Hold an order for review
   */
  private async holdOrder(orderId?: string, flagId?: string): Promise<void> {
    if (!orderId) return;
    
    const db = getFirestore();
    await db.collection('orders').doc(orderId).update({
      status: 'pending_review',
      fraudFlagId: flagId,
      heldAt: new Date(),
      heldReason: 'Fraud detection'
    });
  }

  /**
   * Block an order
   */
  private async blockOrder(orderId?: string, flagId?: string): Promise<void> {
    if (!orderId) return;
    
    const db = getFirestore();
    await db.collection('orders').doc(orderId).update({
      status: 'blocked',
      fraudFlagId: flagId,
      blockedAt: new Date(),
      blockedReason: 'Fraud prevention'
    });
  }

  /**
   * Send fraud alert
   */
  private async sendFraudAlert(flag: FraudFlag, parameters?: any): Promise<void> {
    // Send to admin notification system
    console.log('Fraud alert:', {
      flagId: flag.id,
      severity: flag.severity,
      flagType: flag.flagType,
      orderId: flag.orderId,
      ...parameters
    });
  }

  /**
   * Mark for manual review
   */
  private async markForManualReview(flagId: string): Promise<void> {
    const db = getFirestore();
    await db.collection(this.fraudFlagsCollection).doc(flagId).update({
      status: FraudStatus.UNDER_REVIEW,
      updatedAt: new Date()
    });
  }

  /**
   * Log fraud evaluation for analytics
   */
  private async logFraudEvaluation(context: FraudContext, flags: FraudFlag[]): Promise<void> {
    const db = getFirestore();
    
    await db.collection('fraud_evaluations').add({
      timestamp: new Date(),
      orderId: context.order?.id,
      ipAddress: context.ipAddress,
      userId: context.userId,
      email: context.email,
      flagsGenerated: flags.length,
      maxSeverity: flags.length > 0 ? 
        Math.max(...flags.map(f => Object.values(FraudSeverity).indexOf(f.severity))) : null,
      evaluationTime: new Date(),
      context: {
        orderValue: context.order?.total,
        userAgent: context.userAgent
      }
    });
  }

  /**
   * Generate unique flag ID
   */
  private generateFlagId(): string {
    return `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }


  /**
   * Get fraud flags for an order
   */
  async getFraudFlagsForOrder(orderId: string): Promise<FraudFlag[]> {
    const db = getFirestore();
    
    const snapshot = await (db.collection(this.fraudFlagsCollection)
      .where('orderId', '==', orderId) as any)
      .get();
    

    return snapshot.docs.map((doc: any) => doc.data() as FraudFlag);
  }

  /**
   * Update fraud flag status
   */
  async updateFraudFlagStatus(flagId: string, status: FraudStatus, reviewedBy?: string, falsePositive?: boolean): Promise<void> {
    const db = getFirestore();
    
    await db.collection(this.fraudFlagsCollection).doc(flagId).update({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      falsePositive,
      updatedAt: new Date()
    });
  }


  /**
   * Get fraud statistics
   */
  async getFraudStatistics(startDate: Date, endDate: Date): Promise<any> {
    const db = getFirestore();
    
    const snapshot = await (db.collection(this.fraudFlagsCollection)
      .where('createdAt', '>=', startDate) as any)
      .where('createdAt', '<=', endDate)
      .get();
    

    const flags = snapshot.docs.map((doc: any) => doc.data() as FraudFlag);
    
    return {
      totalFlags: flags.length,

      bySeverity: {
        critical: flags.filter((f: FraudFlag) => f.severity === FraudSeverity.CRITICAL).length,
        high: flags.filter((f: FraudFlag) => f.severity === FraudSeverity.HIGH).length,
        medium: flags.filter((f: FraudFlag) => f.severity === FraudSeverity.MEDIUM).length,
        low: flags.filter((f: FraudFlag) => f.severity === FraudSeverity.LOW).length
      },

      byType: Object.values(FraudFlagType).reduce((acc, type) => {
        acc[type] = flags.filter((f: FraudFlag) => f.flagType === type).length;
        return acc;
      }, {} as Record<string, number>),

      byStatus: {
        pending: flags.filter((f: FraudFlag) => f.status === FraudStatus.PENDING).length,
        underReview: flags.filter((f: FraudFlag) => f.status === FraudStatus.UNDER_REVIEW).length,
        approved: flags.filter((f: FraudFlag) => f.status === FraudStatus.APPROVED).length,
        rejected: flags.filter((f: FraudFlag) => f.status === FraudStatus.REJECTED).length,
        falsePositive: flags.filter((f: FraudFlag) => f.status === FraudStatus.FALSE_POSITIVE).length
      },
      averageScore: flags.length > 0 ? 
        flags.reduce((sum: number, f: FraudFlag) => sum + f.score, 0) / flags.length : 0
    };
  }
}

// Export singleton instance
export const fraudDetectionService = new FraudDetectionService();

/**
 * Firestore fraud schema
 */
export const FRAUD_SCHEMA = {
  collections: {
    fraud_flags: {
      description: 'Fraud flags generated by detection system',
      fields: {
        orderId: 'string (required)',
        userId: 'string (optional)',
        ipAddress: 'string (optional)',
        email: 'string (optional)',
        flagType: 'enum (see FraudFlagType)',
        severity: 'enum (low, medium, high, critical)',
        score: 'number (0-100)',
        triggeredRules: 'array of strings',
        metadata: 'object (fraud context)',
        status: 'enum (pending, under_review, approved, rejected, false_positive)',
        createdAt: 'timestamp',
        updatedAt: 'timestamp',
        reviewedAt: 'timestamp (optional)',
        reviewedBy: 'string (optional)',
        falsePositive: 'boolean (optional)'
      },
      indexes: ['orderId', 'flagType', 'severity', 'status', 'createdAt']
    },
    
    fraud_rules: {
      description: 'Configuration for fraud detection rules',
      fields: {
        id: 'string (unique)',
        name: 'string',
        type: 'enum (see FraudFlagType)',
        description: 'string',
        enabled: 'boolean',
        severity: 'enum',
        score: 'number (0-100)',
        conditions: 'array of objects',
        actions: 'array of objects',
        cooldownMinutes: 'number (optional)',
        maxTriggersPerHour: 'number (optional)',
        createdAt: 'timestamp',
        updatedAt: 'timestamp'
      },
      indexes: ['enabled', 'type', 'severity']
    },
    
    fraud_evaluations: {
      description: 'Log of fraud evaluations for analytics',
      fields: {
        timestamp: 'timestamp',
        orderId: 'string',
        ipAddress: 'string',
        userId: 'string',
        email: 'string',
        flagsGenerated: 'number',
        maxSeverity: 'number (optional)',
        evaluationTime: 'timestamp',
        context: 'object'
      },
      indexes: ['timestamp', 'orderId', 'flagsGenerated']
    },
    
    payment_failures: {
      description: 'Log of payment failures for fraud detection',
      fields: {
        orderId: 'string',
        razorpayOrderId: 'string',
        ipAddress: 'string',
        userId: 'string',
        email: 'string',
        failureReason: 'string',
        amount: 'number',
        createdAt: 'timestamp'
      },
      indexes: ['ipAddress', 'userId', 'email', 'createdAt']
    }
  }
};
