// Tabby payment service utility
import { TabbyCustomerDataService } from './tabby-customer-data';

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
      // ✅ TABBY QA FIX: Get real customer data instead of dummy data
      console.log('🔍 Fetching real customer data for Tabby integration...');
      const customerData = await TabbyCustomerDataService.getCustomerData(
        paymentData.buyer.email,
        paymentData.order.reference_id
      );
      
      // ✅ FIX: Ensure email is acceptable for Tabby (avoid test emails)
      const processedEmail = paymentData.buyer.email.toLowerCase().trim();
      
      // Check if email is likely to be rejected by Tabby
      const testEmailPatterns = [
        /^test@/,
        /^example@/,
        /^demo@/,
        /\+test/,
        /test\./,
        /^.*@test\./,
        /^.*@example\./
      ];
      
      const isTestEmail = testEmailPatterns.some(pattern => pattern.test(processedEmail));
      
      if (isTestEmail) {
        console.log('⚠️ Test email detected, may cause Tabby rejection:', processedEmail);
        // For testing purposes, we'll still try but log a warning
      }
      
      // ✅ FIX: Ensure amount is within Tabby's acceptable range (1-5000 AED)
      const amount = parseFloat(paymentData.amount.toString());
      if (amount < 1 || amount > 5000) {
        throw new Error(`Amount ${amount} AED is outside Tabby's acceptable range (1-5000 AED)`);
      }
      
      // Format the payload according to Tabby's API requirements
      const tabbyPayload = {
        payment: {
          amount: amount.toFixed(2), // Ensure proper decimal formatting
          currency: paymentData.currency.toUpperCase(), // Ensure uppercase currency
          description: paymentData.description || 'Green Roasteries Order',
          buyer: {
            phone: paymentData.buyer.phone, // Already formatted in the route (9 digits, no country code)
            email: processedEmail, // Use processed email
            name: paymentData.buyer.name.trim() || 'Customer', // Ensure name is not empty
            dob: "1990-01-01T00:00:00.000Z" // Default DOB in correct ISO format
          },
          shipping_address: {
            city: paymentData.shipping_address.city.trim() || 'Dubai',
            address: paymentData.shipping_address.address.trim() || 'Dubai, UAE',
            zip: paymentData.shipping_address.zip?.trim() || "1111"
          },
          order: {
            tax_amount: parseFloat((paymentData.order.tax_amount / 100).toString()).toFixed(2),
            shipping_amount: parseFloat((paymentData.order.shipping_amount / 100).toString()).toFixed(2),
            discount_amount: parseFloat((paymentData.order.discount_amount / 100).toString()).toFixed(2),
            updated_at: paymentData.order.updated_at,
            reference_id: paymentData.order.reference_id.toString(),
            items: paymentData.order.items.map((item, index) => ({
              title: this.truncateString(item.title?.trim() || `Product ${index + 1}`, 255),
              description: this.truncateString(item.description?.trim() || item.title?.trim() || `Product ${index + 1}`, 255),
              quantity: parseInt(item.quantity.toString()),
              unit_price: parseFloat((item.unit_price / 100).toString()).toFixed(2),
              discount_amount: item.discount_amount ? parseFloat((item.discount_amount / 100).toString()).toFixed(2) : "0.00",
              reference_id: this.truncateString(item.reference_id?.toString() || `item_${index + 1}`, 255),
              image_url: this.truncateString(item.image_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com'}/images/placeholder.jpg`, 255),
              product_url: this.truncateString(item.product_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com'}/shop`, 255),
              gender: "Other",
              category: this.truncateString(item.category?.trim() || "Coffee", 255),
              color: "brown",
              product_material: "organic",
              size_type: "weight",
              size: "M",
              brand: "Green Roasteries",
              is_refundable: true,
              barcode: this.truncateString(`GR${Date.now()}${index}`, 255),
              ppn: this.truncateString(`GR-${item.reference_id || index}`, 255),
              seller: "Green Roasteries"
            }))
          },
          // ✅ TABBY QA FIX: Use REAL customer data instead of dummy data
          buyer_history: customerData.buyer_history,
          order_history: customerData.order_history,
          meta: {
            order_id: paymentData.order.reference_id,
            customer: paymentData.buyer.email // Use actual email for both test and live mode
          },
          attachment: {
            body: "{}",
            content_type: "application/vnd.tabby.v1+json"
          }
        },
        lang: paymentData.lang,
        merchant_code: paymentData.merchant_code,
        merchant_urls: paymentData.merchant_urls,
        token: null
      };

      // Log the request for debugging (with real customer data)
      console.log('✅ Tabby API Request with REAL customer data:', {
        url: `${this.baseUrl}/api/v2/checkout`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey.substring(0, 10)}...`,
        },
        payloadSample: {
          payment: {
            amount: tabbyPayload.payment.amount,
            currency: tabbyPayload.payment.currency,
            buyer: {
              phone: tabbyPayload.payment.buyer.phone,
              email: tabbyPayload.payment.buyer.email
            },
            buyer_history: {
              loyalty_level: customerData.buyer_history.loyalty_level,
              registered_since: customerData.buyer_history.registered_since
            },
            order_history_count: customerData.order_history.length,
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
      
      // Enhanced rejection handling per Tabby documentation
      const installmentProduct = result.configuration?.products?.installments;
      
      // Check if installments are not available (background pre-scoring rejection)
      if (!installmentProduct?.is_available || installmentProduct?.rejection_reason) {
        console.warn('Tabby background pre-scoring rejection detected:', {
          rejection_reason: installmentProduct?.rejection_reason,
          is_available: installmentProduct?.is_available,
          session_id: result.id,
          payment_id: result.payment?.id,
          buyer_email: result.payment?.buyer?.email
        });
        
        // Pass rejection reason to frontend for proper localization
        const rejectionReason = installmentProduct?.rejection_reason || 'not_available';
        
        // Create rejection error with specific type for frontend handling
        const rejectionError = new Error('TABBY_REJECTION');
        (rejectionError as any).type = 'TABBY_REJECTION';
        (rejectionError as any).rejectionReason = rejectionReason;
        (rejectionError as any).sessionId = result.id;
        throw rejectionError;
      }
      
      // Check for explicit rejection status
      if (result.status === 'rejected') {
        console.error('Tabby payment session rejected:', {
          status: result.status,
          rejection_reason_code: result.rejection_reason_code,
          warnings: result.warnings,
          session_id: result.id
        });
        
        const rejectionError = new Error('Your payment could not be processed with Tabby. Please choose another payment method.');
        (rejectionError as any).type = 'TABBY_REJECTION';
        (rejectionError as any).rejectionReason = result.rejection_reason_code || 'session_rejected';
        (rejectionError as any).sessionId = result.id;
        throw rejectionError;
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

  // Capture payment (for authorized payments) - Full API compliance
  async capturePayment(paymentId: string, captureData?: {
    amount?: string;
    reference_id?: string;
    tax_amount?: string;
    shipping_amount?: string;
    discount_amount?: string;
    created_at?: string;
    items?: Array<any>;
  }): Promise<any> {
    try {
      // If no capture data provided, retrieve the original payment to get full details
      let paymentDetails: any = null;
      if (!captureData) {
        console.log('🔍 Retrieving original payment details for full capture...');
        paymentDetails = await this.getPayment(paymentId);
      }

      // Build complete capture request per Tabby API specification
      const capturePayload = {
        // Required: Total payment amount captured (full capture by default)
        amount: captureData?.amount || paymentDetails?.amount || "0.00",
        
        // Idempotency key to avoid duplicate captures
        reference_id: captureData?.reference_id || `capture_${paymentId}_${Date.now()}`,
        
        // Breakdown amounts from original payment
        tax_amount: captureData?.tax_amount || paymentDetails?.order?.tax_amount || "0.00",
        shipping_amount: captureData?.shipping_amount || paymentDetails?.order?.shipping_amount || "0.00", 
        discount_amount: captureData?.discount_amount || paymentDetails?.order?.discount_amount || "0.00",
        
        // Timestamp in ISO format
        created_at: captureData?.created_at || new Date().toISOString(),
        
        // Order items being captured (all items by default for full capture)
        items: captureData?.items || paymentDetails?.order?.items?.map((item: any) => ({
          title: item.title || "Green Roasteries Coffee Product",
          description: item.description || "Premium coffee blend from Green Roasteries",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || "0.00",
          discount_amount: item.discount_amount || "0.00",
          reference_id: item.reference_id || `GR-${Date.now()}`,
          image_url: item.image_url || "https://thegreenroasteries.com/images/coffee-1.jpg",
          product_url: item.product_url || "https://thegreenroasteries.com/shop",
          gender: item.gender || "Other",
          category: item.category || "Coffee",
          color: item.color || "brown",
          product_material: item.product_material || "organic",
          size_type: item.size_type || "weight",
          size: item.size || "250g",
          brand: item.brand || "Green Roasteries",
          is_refundable: item.is_refundable !== false,
          barcode: item.barcode || `GR${Date.now()}`,
          ppn: item.ppn || `GR-${item.reference_id || Date.now()}`,
          seller: item.seller || "Green Roasteries"
        })) || []
      };

      console.log('📞 Making capture request to Tabby API:', {
        paymentId,
        url: `${this.baseUrl}/api/v2/payments/${paymentId}/captures`,
        payload: {
          amount: capturePayload.amount,
          reference_id: capturePayload.reference_id,
          tax_amount: capturePayload.tax_amount,
          shipping_amount: capturePayload.shipping_amount,
          discount_amount: capturePayload.discount_amount,
          itemsCount: capturePayload.items.length
        }
      });

      const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/captures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(capturePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ Tabby capture API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`Failed to capture payment: ${errorData?.message || response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Capture successful:', {
        captureId: result.id,
        amount: result.amount,
        created_at: result.created_at
      });

      return result;
    } catch (error) {
      console.error('❌ Tabby payment capture error:', error);
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

  /**
   * Truncate string to comply with Tabby's 255 character limit
   */
  private truncateString(str: string, maxLength: number = 255): string {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  }
}

export const tabbyService = new TabbyService();
export default TabbyService; 