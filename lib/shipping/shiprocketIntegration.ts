import { Order } from '@/lib/types';

export interface ShiprocketCredentials {
  email: string;
  password: string;
}

export interface ShiprocketOrder {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  billing_alternate_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_pincode: string;
  shipping_state: string;
  shipping_country: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_alternate_phone: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  ewaybill_no: string;
  invoice_number: string;
}

export interface ShiprocketOrderItem {
  sku: string;
  name: string;
  units: number;
  selling_price: number;
  hsn_code: string;
  tax_rate: number;
  discount: number;
}

export interface ShiprocketResponse {
  success: boolean;
  data?: any;
  message?: string;
  errors?: string[];
}

export interface ShipmentDetails {
  shipment_id: number;
  awb_code: string;
  courier_name: string;
  tracking_url: string;
  order_status: string;
}

export interface ShippingMode {
  type: 'shiprocket' | 'manual';
  enabled: boolean;
}

class ShiprocketService {
  private baseUrl = 'https://apiv2.shiprocket.in/v1';
  private credentials: ShiprocketCredentials | null = null;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Initialize Shiprocket service with credentials
   */
  constructor() {
    this.credentials = {
      email: process.env.SHIPROCKET_EMAIL || '',
      password: process.env.SHIPROCKET_PASSWORD || ''
    };
  }


/**
 * Authenticate with Shiprocket API
 * Uses external auth endpoint for production
 */
private async authenticate(): Promise<string> {
    if (!this.credentials?.email || !this.credentials?.password) {
        throw new Error('Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD');
    }

    // Reuse token if still valid (with 5-minute buffer)
    if (this.authToken && Date.now() < (this.tokenExpiry - 5 * 60 * 1000)) {
        return this.authToken;
    }

    try {
        console.log('🔐 Authenticating with Shiprocket...');

        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.credentials),
        });

        const data: { token?: string; message?: string } = await response.json();

        if (!response.ok) {
            console.error('❌ Shiprocket auth failed:', {
                status: response.status,
                statusText: response.statusText,
                message: data.message
            });
            throw new Error(data.message || `Authentication failed: ${response.status}`);
        }

        if (!data.token) {
            console.error('❌ No token received from Shiprocket');
            throw new Error('No authentication token received');
        }

        // Store token and set expiry (Shiprocket tokens are valid for 24 hours)
        this.authToken = data.token;
        this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        console.log('✅ Shiprocket authentication successful');
        return data.token;
    } catch (error) {
        console.error('💥 Shiprocket authentication error:', error);
        // Clear cached token on auth failure
        this.authToken = null;
        this.tokenExpiry = 0;
        throw new Error(`Shiprocket authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


  /**
   * Create shipment order in Shiprocket
   * Uses idempotency to prevent duplicate shipments
   */
  async createShipment(order: Order): Promise<ShiprocketResponse> {
    try {
      console.log('📦 Creating Shiprocket shipment for order:', order.id);

      const token = await this.authenticate();
      const shiprocketOrder = this.convertOrderToShiprocketFormat(order);

      console.log('📋 Shiprocket order payload:', JSON.stringify(shiprocketOrder, null, 2));

      // Use external orders/create/adhoc endpoint
      const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shiprocketOrder)
      });

      const data = await response.json();

      console.log('📡 Shiprocket API response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      if (!response.ok) {
        console.error('❌ Shiprocket shipment creation failed:', {
          status: response.status,
          errors: data.errors || data.message
        });

        return {
          success: false,
          message: data.message || data.errors?.join(', ') || `HTTP ${response.status}: Failed to create shipment`,
          errors: data.errors
        };
      }

      if (!data.order_id) {
        console.error('❌ Invalid Shiprocket response - missing order_id');
        return {
          success: false,
          message: 'Invalid response from Shiprocket - missing order ID'
        };
      }

      console.log('✅ Shiprocket shipment created successfully:', {
        orderId: data.order_id,
        shipmentId: data.shipment_id,
        awbCode: data.awb_code,
        courier: data.courier_name
      });

      return { success: true, data };
    } catch (error) {
      console.error('💥 Shiprocket shipment creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred while creating shipment'
      };
    }
  }

  /**
   * Get shipment tracking information
   */
  async getShipmentTracking(shipmentId: number): Promise<ShiprocketResponse> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}/track`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get tracking info');
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Shiprocket tracking error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentId: number): Promise<ShiprocketResponse> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel shipment');
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Shiprocket cancellation error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Convert internal order to Shiprocket format
   */
  private convertOrderToShiprocketFormat(order: Order): ShiprocketOrder {
    // Calculate package dimensions and weight
    const itemWeight = 0.2; // 200g per cosmetic item
    const totalWeight = order.items.reduce((sum, item) => sum + (itemWeight * item.quantity), 0);

    return {
      order_id: order.id,
      order_date: order.createdAt.toDate().toISOString(),
      pickup_location: 'Mumbai Warehouse',
      channel_id: 'XVC-ECOM',
      comment: `Order from XVC Cosmetics - ${order.id}`,
      
      // Billing details
      billing_customer_name: order.customerName.split(' ')[0] || order.customerName,
      billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '',
      billing_address: order.shippingAddress.line1,
      billing_address_2: order.shippingAddress.line2 || '',
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.postalCode,
      billing_state: order.shippingAddress.state,
      billing_country: order.shippingAddress.country,
      billing_email: order.customerEmail,
      billing_phone: order.customerPhone,
      billing_alternate_phone: '',
      
      // Shipping details (same as billing for this demo)
      shipping_is_billing: true,
      shipping_customer_name: order.customerName.split(' ')[0] || order.customerName,
      shipping_last_name: order.customerName.split(' ').slice(1).join(' ') || '',
      shipping_address: order.shippingAddress.line1,
      shipping_address_2: order.shippingAddress.line2 || '',
      shipping_city: order.shippingAddress.city,
      shipping_pincode: order.shippingAddress.postalCode,
      shipping_state: order.shippingAddress.state,
      shipping_country: order.shippingAddress.country,
      shipping_email: order.customerEmail,
      shipping_phone: order.customerPhone,
      shipping_alternate_phone: '',
      
      // Order items
      order_items: order.items.map(item => ({
        sku: item.productId,
        name: item.productName,
        units: item.quantity,
        selling_price: item.price,
        hsn_code: '33049900', // Cosmetics HSN code
        tax_rate: 18, // 18% GST
        discount: 0
      })),
      
      // Payment and totals
      payment_method: 'prepaid',
      shipping_charges: 0, // Free shipping
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total,
      
      // Package details
      length: 20, // cm
      breadth: 15, // cm
      height: 10, // cm
      weight: totalWeight,
      
      // Additional fields
      ewaybill_no: '',
      invoice_number: `XVC-${order.id}`
    };
  }
}

/**
 * Shipping service class that handles both Shiprocket and manual modes
 */
export class ShippingService {
  private shiprocketService: ShiprocketService;
  private shippingMode: ShippingMode;

  constructor() {
    this.shiprocketService = new ShiprocketService();
    this.shippingMode = {
      type: process.env.SHIPPING_MODE === 'shiprocket' ? 'shiprocket' : 'manual',
      enabled: process.env.SHIPPING_MODE === 'shiprocket'
    };
  }

  /**
   * Create shipment for an order with idempotency
   * Ensures only one shipment per order
   */
  async createShipment(order: Order): Promise<{
    success: boolean;
    shipmentDetails?: ShipmentDetails;
    trackingNumber?: string;
    trackingUrl?: string;
    message?: string;
  }> {
    if (!this.shippingMode.enabled) {
      console.log('⚠️ Shipping is disabled, skipping shipment creation');
      return {
        success: false,
        message: 'Shipping is disabled'
      };
    }

    // Check if order already has shipping info (idempotency)
    if (order.shipping?.shipmentId) {
      console.log('ℹ️ Order already has shipment:', order.shipping.shipmentId);
      return {
        success: true,
        shipmentDetails: {
          shipment_id: parseInt(order.shipping.shipmentId),
          awb_code: order.shipping.awbCode || '',
          courier_name: order.shipping.courierName || '',
          tracking_url: order.shipping.trackingUrl || '',
          order_status: order.shipping.status || 'shipped'
        },
        message: 'Shipment already exists'
      };
    }

    if (this.shippingMode.type === 'shiprocket') {
      return await this.createShiprocketShipment(order);
    } else {
      return await this.createManualShipment(order);
    }
  }

  /**
   * Create shipment via Shiprocket API
   */
  private async createShiprocketShipment(order: Order): Promise<{
    success: boolean;
    shipmentDetails?: ShipmentDetails;
    message?: string;
  }> {
    try {
      const result = await this.shiprocketService.createShipment(order);
      
      if (result.success && result.data) {
        const shipmentDetails: ShipmentDetails = {
          shipment_id: result.data.shipment_id,
          awb_code: result.data.awb_code,
          courier_name: result.data.courier_name,
          tracking_url: `https://shiprocket.co.in/tracking/${result.data.awb_code}`,
          order_status: result.data.status
        };

        return {
          success: true,
          shipmentDetails
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to create shipment'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create manual shipment (for fallback or testing)
   */
  private async createManualShipment(order: Order): Promise<{
    success: boolean;
    trackingNumber?: string;
    trackingUrl?: string;
    message?: string;
  }> {
    // Generate a mock tracking number for manual shipping
    const trackingNumber = `XVC${Date.now()}${order.id.slice(-4)}`;
    const trackingUrl = `https://track.xvc.com/${trackingNumber}`;

    return {
      success: true,
      trackingNumber,
      trackingUrl
    };
  }

  /**
   * Get tracking information
   */
  async getTrackingInfo(shipmentId: number): Promise<{
    success: boolean;
    trackingInfo?: any;
    message?: string;
  }> {
    if (!this.shippingMode.enabled) {
      return {
        success: false,
        message: 'Shipping is disabled'
      };
    }

    if (this.shippingMode.type === 'shiprocket') {
      try {
        const result = await this.shiprocketService.getShipmentTracking(shipmentId);
        
        if (result.success) {
          return {
            success: true,
            trackingInfo: result.data
          };
        } else {
          return {
            success: false,
            message: result.message || 'Failed to get tracking info'
          };
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return {
      success: false,
      message: 'Tracking not available for manual shipping'
    };
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentId: number): Promise<{
    success: boolean;
    message?: string;
  }> {
    if (!this.shippingMode.enabled) {
      return {
        success: false,
        message: 'Shipping is disabled'
      };
    }

    if (this.shippingMode.type === 'shiprocket') {
      try {
        const result = await this.shiprocketService.cancelShipment(shipmentId);
        
        return {
          success: result.success,
          message: result.message
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return {
      success: true,
      message: 'Manual shipment cancelled'
    };
  }

  /**
   * Get current shipping mode
   */
  getShippingMode(): ShippingMode {
    return this.shippingMode;
  }

  /**
   * Check if shipping is enabled
   */
  isShippingEnabled(): boolean {
    return this.shippingMode.enabled;
  }
}

// Export singleton instance
export const shippingService = new ShippingService();
