'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  contentByLang: <T>(enContent: T, arContent: T) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Expanded translation object with more keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // English translations
    'home': 'Home',
    'shop': 'Shop',
    'about': 'About',
    'contact': 'Contact',
    'profile': 'Profile',
    'settings': 'Settings',
    'logout': 'Logout',
    'free_shipping_message': 'Free shipping on all orders over 65D',
    'my_account': 'My Account',
    'wishlist': 'Wishlist',
    'cart': 'Cart',
    'all_products': 'All Products',
    'your_cart': 'Your Cart',
    'cart_empty': 'Your cart is currently empty.',
    'total': 'Total',
    'view_cart': 'View Cart',
    'checkout': 'Checkout',
    'open_user_menu': 'Open user menu',
    
    // Product page translations
    'description': 'Description',
    'no_description': 'No description available',
    'weight': 'Weight',
    'beans': 'Beans',
    'additions': 'Additions',
    'quantity': 'Quantity',
    'only_left': 'Only',
    'left': 'left',
    'add_to_cart': 'Add to Cart',
    'buy_now': 'Buy Now',
    'category': 'Category',
    'you_may_also_like': 'You May Also Like',
    'views': 'views',
    'reviews': 'reviews',
    'off': 'OFF',
    
    // Cart page translations
    'continue_shopping': 'Continue Shopping',
    'product': 'Product',
    'price': 'Price',
    'remove': 'Remove',
    'update_cart': 'Update Cart',
    'order_summary': 'Order Summary',
    'discount_code': 'Discount Code',
    'enter_code': 'Enter code',
    'apply': 'Apply',
    'subtotal': 'Subtotal',
    'items': 'items',
    'shipping': 'Shipping',
    'free': 'Free',
    'proceed_to_checkout': 'Proceed to Checkout',
    'secure_checkout': 'Secure Checkout',
    
    // Backend translations
    'backend_logo': 'Backend Dashboard',
    'dashboard': 'Dashboard',
    'products': 'Products',
    'categories': 'Categories',
    'orders': 'Orders',
    'customers': 'Customers',
    'users': 'Users',
    'promotions': 'Promotions',
    'dashboard_overview': 'Dashboard Overview',
    'todays_orders': 'Today\'s Orders',
    'total_products': 'Total Products',
    'active_promotions': 'Active Promotions',
    'recent_orders': 'Recent Orders',
    'popular_products': 'Popular Products',
    'no_orders_yet': 'No orders yet',
    'no_data_available': 'No data available',
    'admin_dashboard': 'Admin Dashboard',
    
    // Dashboard charts and statistics translations
    'sales_trend': 'Sales Trend',
    'revenue': 'Revenue',
    'sales_trends': 'Sales Trends',
    'product_performance': 'Product Performance',
    'customer_growth': 'Customer Growth',
    'order_status': 'Order Status',
    'top_products': 'Top Products',
    'sales_amount': 'Sales Amount',
    'new_customers': 'New Customers',
    'pending_orders': 'Pending',
    'total_revenue': 'Revenue',
    'order_id': 'Order ID',
    'customer': 'Customer',
    'date': 'Date',
    'status': 'Status',
    'delivered': 'Delivered',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'new': 'New',
    'cancelled': 'Cancelled',
    'view_all_orders': 'View All Orders',
    'product_name': 'Product Name',
    'in_stock': 'In Stock',
    'sales': 'Sales',
    'view_all_products': 'View All Products',
    
    // Home page translations
    'discover_collection': 'Discover Our Collection',
    'premium_coffee_beans': 'Handpicked premium coffee beans from around the world, roasted to perfection',
    'special_offers': 'Special Offers',
    'exclusive_deals': 'Don\'t miss out on our exclusive deals and discounts!',
    'no_offers': 'No special offers available right now.',
    'use_code': 'Use code',
    'free_shipping': 'Free Shipping',
    'orders_over': 'Orders over 65D',
    'easy_returns': 'Easy Returns',
    'return_policy': '30-day return policy',
    'secure_payments': 'Secure Payments',
    'encrypted_transactions': 'Encrypted transactions',
    'support_24_7': '24/7 Support',
    'always_here': 'Always here to help',
    'join_newsletter': 'Join Our Newsletter',
    'subscribe_updates': 'Subscribe to receive updates, access to exclusive deals, and more.',
    'enter_email': 'Enter your email',
    'subscribe': 'Subscribe',
    'privacy_consent': 'By subscribing you agree to with our Privacy Policy',
    'no_sliders_available': 'No sliders available',
    'no_promotions': 'No promotions at the moment.',
    
    // Category header translations
    'category_header': 'CATEGORY',
    'nuts_dried_fruits': 'NUTS & DRIED FRUITS',
    'coffee_beans': 'COFFEE BEANS',
    'coffee_grounds': 'COFFEE GROUNDS',
    'coffee_capsules': 'COFFEE CAPSULES',
    'accessories': 'ACCESSORIES',
    'gift_sets': 'GIFT SETS',
    'single_origin_header': 'SINGLE ORIGIN',
    'espresso_header': 'ESPRESSO',
    'specialty_header': 'SPECIALTY',
    'products_header': 'PRODUCTS',
  },
  ar: {
    // Arabic translations
    'home': 'الرئيسية',
    'shop': 'المتجر',
    'about': 'من نحن',
    'contact': 'اتصل بنا',
    'profile': 'الملف الشخصي',
    'settings': 'الإعدادات',
    'logout': 'تسجيل الخروج',
    'free_shipping_message': 'شحن مجاني للطلبات التي تزيد عن 65 د',
    'my_account': 'حسابي',
    'wishlist': 'المفضلة',
    'cart': 'السلة',
    'all_products': 'جميع المنتجات',
    'your_cart': 'سلة التسوق',
    'cart_empty': 'سلة التسوق فارغة',
    'total': 'المجموع',
    'view_cart': 'عرض السلة',
    'checkout': 'إتمام الشراء',
    'open_user_menu': 'فتح قائمة المستخدم',
    
    // Product page translations
    'description': 'الوصف',
    'no_description': 'لا يوجد وصف متاح',
    'weight': 'الوزن',
    'beans': 'البن',
    'additions': 'الإضافات',
    'quantity': 'الكمية',
    'only_left': 'فقط',
    'left': 'متبقي',
    'add_to_cart': 'أضف إلى السلة',
    'buy_now': 'اشتر الآن',
    'category': 'التصنيف',
    'you_may_also_like': 'قد يعجبك أيضاً',
    'views': 'مشاهدات',
    'reviews': 'تقييمات',
    'off': 'خصم',
    
    // Cart page translations
    'continue_shopping': 'مواصلة التسوق',
    'product': 'المنتج',
    'price': 'السعر',
    'remove': 'إزالة',
    'update_cart': 'تحديث السلة',
    'order_summary': 'ملخص الطلب',
    'discount_code': 'رمز الخصم',
    'enter_code': 'أدخل الرمز',
    'apply': 'تطبيق',
    'subtotal': 'المجموع الفرعي',
    'items': 'عناصر',
    'shipping': 'الشحن',
    'free': 'مجاني',
    'proceed_to_checkout': 'المتابعة للدفع',
    'secure_checkout': 'دفع آمن',
    
    // Backend translations
    'backend_logo': 'لوحة التحكم',
    'dashboard': 'لوحة التحكم',
    'products': 'المنتجات',
    'categories': 'التصنيفات',
    'orders': 'الطلبات',
    'customers': 'العملاء',
    'users': 'المستخدمين',
    'promotions': 'العروض',
    'dashboard_overview': 'نظرة عامة على لوحة التحكم',
    'todays_orders': 'طلبات اليوم',
    'total_products': 'إجمالي المنتجات',
    'active_promotions': 'العروض النشطة',
    'recent_orders': 'الطلبات الأخيرة',
    'popular_products': 'المنتجات الشائعة',
    'no_orders_yet': 'لا توجد طلبات حتى الآن',
    'no_data_available': 'لا توجد بيانات متاحة',
    'admin_dashboard': 'لوحة تحكم المدير',
    
    // Dashboard charts and statistics translations
    'sales_trend': 'اتجاه المبيعات',
    'revenue': 'الإيرادات',
    'sales_trends': 'اتجاهات المبيعات',
    'product_performance': 'أداء المنتج',
    'customer_growth': 'نمو العملاء',
    'order_status': 'حالة الطلب',
    'top_products': 'أفضل المنتجات',
    'sales_amount': 'مبلغ المبيعات',
    'new_customers': 'عملاء جدد',
    'pending_orders': 'قيد الانتظار',
    'total_revenue': 'الإيرادات',
    'order_id': 'رقم الطلب',
    'customer': 'العميل',
    'date': 'التاريخ',
    'status': 'الحالة',
    'delivered': 'تم التسليم',
    'processing': 'قيد المعالجة',
    'shipped': 'تم الشحن',
    'new': 'جديد',
    'cancelled': 'ملغي',
    'view_all_orders': 'عرض جميع الطلبات',
    'product_name': 'اسم المنتج',
    'in_stock': 'متوفر',
    'sales': 'المبيعات',
    'view_all_products': 'عرض جميع المنتجات',
    
    // Home page translations
    'discover_collection': 'اكتشف مجموعتنا',
    'premium_coffee_beans': 'حبوب قهوة مميزة مختارة من جميع أنحاء العالم، محمصة بإتقان',
    'special_offers': 'عروض خاصة',
    'exclusive_deals': 'لا تفوت عروضنا وخصوماتنا الحصرية!',
    'no_offers': 'لا توجد عروض خاصة متاحة الآن.',
    'use_code': 'استخدم الرمز',
    'free_shipping': 'شحن مجاني',
    'orders_over': 'للطلبات أكثر من 65 د',
    'easy_returns': 'إرجاع سهل',
    'return_policy': 'سياسة الإرجاع خلال 30 يوم',
    'secure_payments': 'مدفوعات آمنة',
    'encrypted_transactions': 'معاملات مشفرة',
    'support_24_7': 'دعم على مدار الساعة',
    'always_here': 'دائما هنا للمساعدة',
    'join_newsletter': 'انضم إلى نشرتنا الإخبارية',
    'subscribe_updates': 'اشترك للحصول على التحديثات والوصول إلى العروض الحصرية والمزيد.',
    'enter_email': 'أدخل بريدك الإلكتروني',
    'subscribe': 'اشتراك',
    'privacy_consent': 'بالاشتراك فإنك توافق على سياسة الخصوصية الخاصة بنا',
    'no_sliders_available': 'لا توجد شرائح متاحة',
    'no_promotions': 'لا توجد عروض ترويجية في الوقت الحالي.',
    
    // Category header translations
    'category_header': 'التصنيف',
    'nuts_dried_fruits': 'المكسرات والفواكه المجففة',
    'coffee_beans': 'حبوب القهوة',
    'coffee_grounds': 'القهوة المطحونة',
    'coffee_capsules': 'كبسولات القهوة',
    'accessories': 'الإكسسوارات',
    'gift_sets': 'أطقم الهدايا',
    'single_origin_header': 'أحادي المصدر',
    'espresso_header': 'إسبريسو',
    'specialty_header': 'مميز',
    'products_header': 'المنتجات',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en'); // Default to English

  useEffect(() => {
    // Set dir attribute on document for RTL support when language is Arabic
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }

    // Save language preference to localStorage
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  useEffect(() => {
    // Load language preference from localStorage on initial load
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return translations[language][key] || fallback || key;
  };

  // Content by language function
  const contentByLang = <T,>(enContent: T, arContent: T): T => {
    return language === 'ar' ? arContent : enContent;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, contentByLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 