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
  id: string; // session id
  status: string;
  token: string | null;
  lang: string;
    merchant_code: string;
  merchant_urls: {
    success: string;
    cancel: string;
    failure: string;
  };
  merchant: {
    name: string;
    address: string;
    logo: string;
  };
  configuration: {
    available_products: {
      installments: Array<{
        web_url: string;
        qr_code: string;
      }>;
    };
    expires_at: string;
    products: {
      installments: {
        type: string;
        is_available: boolean;
        rejection_reason: string | null;
      };
    };
  };
  payment: {
    id: string; // payment id
    created_at: string;
    expires_at: string;
    status: string;
    is_test: boolean;
    amount: string;
    currency: string;
    description: string;
    buyer: {
      phone: string;
      email: string;
      name: string;
      dob: string;
    };
    shipping_address: {
      city: string;
      address: string;
      zip: string;
    };
    order: {
      tax_amount: string;
      shipping_amount: string;
      discount_amount: string;
      updated_at: string;
      reference_id: string;
      items: Array<{
        title: string;
        description: string;
        quantity: number;
        unit_price: string;
        discount_amount: string;
        reference_id: string;
        image_url: string;
        product_url: string;
        gender: string;
        category: string;
        color: string;
        product_material: string;
        size_type: string;
        size: string;
        brand: string;
        is_refundable: boolean;
        barcode: string;
        ppn: string;
        seller: string;
      }>;
    };
    captures: Array<{
      id: string;
      amount: string;
      reference_id: string;
      tax_amount: string;
      shipping_amount: string;
      discount_amount: string;
      created_at: string;
      items: Array<any>;
    }>;
    refunds: Array<{
      id: string;
      amount: string;
      reference_id: string;
      reason: string;
      created_at: string;
      items: Array<any>;
    }>;
    buyer_history: {
      registered_since: string;
      loyalty_level: number;
      wishlist_count: number;
      is_social_networks_connected: boolean;
      is_phone_number_verified: boolean;
      is_email_verified: boolean;
    };
    order_history: Array<{
      purchased_at: string;
      amount: string;
      payment_method: string;
      status: string;
      buyer: {
        phone: string;
        email: string;
        name: string;
        dob: string;
      };
      shipping_address: {
        city: string;
        address: string;
        zip: string;
      };
      items: Array<any>;
    }>;
    meta: {
      order_id: string;
      customer: string;
    };
    attachment: {
      body: string;
      content_type: string;
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
    
    // Debug logging (remove in production)
    console.log('Tabby Service initialized with:', {
      baseUrl: this.baseUrl,
      mode: this.secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE',
      publicKey: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'NOT_SET',
      secretKey: this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'NOT_SET',
      merchantCode: this.merchantCode
    });
  }

  // Create a Tabby payment session
  async createPayment(paymentData: TabbyPaymentRequest): Promise<TabbyPaymentResponse> {
    try {
      // Format the payload according to Tabby's API requirements
      const tabbyPayload = {
        payment: {
          amount: paymentData.amount.toString(), // Amount as string
          currency: paymentData.currency,
          description: paymentData.description,
          buyer: {
            phone: paymentData.buyer.phone,
            email: paymentData.buyer.email, // Use actual email for both test and live mode
            name: paymentData.buyer.name,
            dob: "1990-01-01T00:00:00.000Z" // Default DOB
          },
          shipping_address: {
            city: paymentData.shipping_address.city,
            address: paymentData.shipping_address.address,
            zip: paymentData.shipping_address.zip || "1111"
          },
          order: {
            tax_amount: (paymentData.order.tax_amount / 100).toFixed(2), // Convert back to decimal string
            shipping_amount: (paymentData.order.shipping_amount / 100).toFixed(2),
            discount_amount: (paymentData.order.discount_amount / 100).toFixed(2),
            updated_at: paymentData.order.updated_at,
            reference_id: paymentData.order.reference_id,
            items: paymentData.order.items.map(item => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unit_price: (item.unit_price / 100).toFixed(2), // Convert back to decimal string
              discount_amount: "0.00",
              reference_id: item.reference_id,
              image_url: item.image_url || "https://example.com/",
              product_url: item.product_url || "https://example.com/",
              gender: "Other",
              category: item.category || "Coffee",
              color: "brown",
              product_material: "organic",
              size_type: "weight",
              size: "M",
              brand: "Green Roasteries",
              is_refundable: true,
              barcode: "12345678",
              ppn: "GR-" + item.reference_id,
              seller: "Green Roasteries"
            }))
          },
          buyer_history: {
            registered_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
            loyalty_level: 1,
            wishlist_count: 2,
            is_social_networks_connected: true,
            is_phone_number_verified: true,
            is_email_verified: true
          },
          order_history: [{
            purchased_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            amount: (paymentData.amount * 0.8).toFixed(2), // Previous order was 80% of current
            payment_method: "card",
            status: "completed",
            buyer: {
              phone: paymentData.buyer.phone,
              email: paymentData.buyer.email, // Use actual email for both test and live mode
              name: paymentData.buyer.name,
              dob: "1990-01-01T00:00:00.000Z"
            },
            shipping_address: {
              city: paymentData.shipping_address.city,
              address: paymentData.shipping_address.address,
              zip: paymentData.shipping_address.zip || "1111"
            },
            items: paymentData.order.items.map(item => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unit_price: (item.unit_price / 100).toFixed(2),
              discount_amount: "0.00",
              reference_id: item.reference_id,
              image_url: item.image_url || "https://example.com/",
              product_url: item.product_url || "https://example.com/",
              ordered: 0,
              captured: 0,
              shipped: 0,
              refunded: 0,
              gender: "Other",
              category: item.category || "Coffee",
              color: "brown",
              product_material: "organic",
              size_type: "weight",
              size: "M",
              brand: "Green Roasteries"
            }))
          }],
          meta: {
            order_id: paymentData.order.reference_id,
            customer: paymentData.buyer.email // Use actual email for both test and live mode
          },
          attachment: {
            body: "{}",
            content_type: "application/json"
          }
        },
        lang: paymentData.lang,
        merchant_code: paymentData.merchant_code,
        merchant_urls: paymentData.merchant_urls,
        token: null
      };

      // Log the request for debugging
      console.log('Tabby API Request:', {
        url: `${this.baseUrl}/api/v2/checkout`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey.substring(0, 10)}...`,
        },
        payloadSample: {
          payment: {
            amount: tabbyPayload.payment.amount,
            currency: tabbyPayload.payment.currency,
            merchant_code: tabbyPayload.merchant_code,
            itemsCount: tabbyPayload.payment.order.items.length
          }
        }
      });

      const response = await fetch(`${this.baseUrl}/api/v2/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(tabbyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Tabby API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Tabby API Error: ${errorData?.message || response.statusText} (${response.status})`);
      }

      const result = await response.json();
      
      // Check if payment was rejected
      if (result.status === 'rejected') {
        console.error('Tabby payment rejected:', {
          rejection_reason_code: result.rejection_reason_code,
          warnings: result.warnings,
          configuration: result.configuration?.products?.installments
        });
        throw new Error(`Tabby payment rejected: ${result.rejection_reason_code}. Installments are ${result.configuration?.products?.installments?.is_available ? 'available' : 'not available'} - ${result.configuration?.products?.installments?.rejection_reason || 'unknown reason'}`);
      }
      
      return result;
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