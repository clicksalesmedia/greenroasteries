// Tabby payment service utility
export interface TabbyPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  buyer: {
    phone: string;
    email: string;
    name: string;
  };
  shipping_address: {
    city: string;
    address: string;
    zip?: string;
  };
  order: {
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    updated_at: string;
    reference_id: string;
    items: Array<{
      title: string;
      description: string;
      quantity: number;
      unit_price: number;
      discount_amount?: number;
      reference_id: string;
      image_url?: string;
      product_url?: string;
      category: string;
    }>;
  };
  merchant_code: string;
  lang: string;
  merchant_urls: {
    success: string;
    cancel: string;
    failure: string;
  };
}

export interface TabbyPaymentResponse {
  status: string;
  id: string;
  payment: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    buyer: any;
    shipping_address: any;
    order: any;
    merchant_code: string;
    created_at: string;
    expires_at: string;
  };
  configuration: {
    available_products: {
      installments: Array<{
        type: string;
        web_url: string;
      }>;
    };
  };
}

class TabbyService {
  private baseUrl: string;
  private publicKey: string;
  private secretKey: string;
  private merchantCode: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.tabby.ai' 
      : 'https://api.tabby.ai'; // Tabby uses same URL for test/prod
    this.publicKey = process.env.TABBY_PUBLIC_KEY || '';
    this.secretKey = process.env.TABBY_SECRET_KEY || '';
    this.merchantCode = process.env.TABBY_MERCHANT_CODE || '';
  }

  // Create a Tabby payment session
  async createPayment(paymentData: TabbyPaymentRequest): Promise<TabbyPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tabby API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tabby payment creation error:', error);
      throw error;
    }
  }

  // Retrieve payment details
  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tabby payment retrieval error:', error);
      throw error;
    }
  }

  // Capture payment (for authorized payments)
  async capturePayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/captures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to capture payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tabby payment capture error:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount: number, reason?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          amount: amount,
          reason: reason || 'requested_by_customer',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refund payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tabby payment refund error:', error);
      throw error;
    }
  }

  // Check if Tabby is available for given amount and currency
  isAvailable(amount: number, currency: string = 'AED'): boolean {
    // Tabby is typically available for amounts between 0 and 5000 AED
    return amount >= 1 && amount <= 5000 && currency.toUpperCase() === 'AED';
  }

  // Get merchant configuration
  getMerchantConfig() {
    return {
      publicKey: this.publicKey,
      merchantCode: this.merchantCode,
      baseUrl: this.baseUrl,
    };
  }
}

export const tabbyService = new TabbyService();
export default TabbyService; 