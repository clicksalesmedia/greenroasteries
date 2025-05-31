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
    'free_shipping_message': 'Free shipping on all orders over 200',
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
    
    // Checkout page translations
    'customer_info': 'Customer Information',
    'your_details': 'Your details',
    'shipping_info': 'Shipping Information',
    'delivery_information': 'Delivery information',
    'payment_info': 'Payment Information',
    'secure_payment': 'Secure payment',
    'include_country_code': 'Include country code (e.g., +971 for UAE). Used for order updates and delivery.',
    'continue_to_shipping': 'Continue to Shipping',
    'emirate': 'Emirate',
    'city': 'City',
    'delivery_address': 'Delivery Address',
    'building_street_area': 'Building name/number, street, area, landmark',
    'complete_delivery_details': 'Please provide complete details to ensure smooth delivery',
    'select_emirate': 'Select an Emirate',
    'select_city': 'Select a city',
    'select_emirate_first': 'Please select an emirate first',
    'continue_to_payment': 'Continue to Payment',
    'back': 'Back',
    'card_information': 'Card Information',
    'all_transactions_secure': 'All transactions are secure and encrypted with Stripe.',
    'pay_amount': 'Pay',
    'tax': 'Tax',
    'discount': 'Discount',
    'calculating': 'Calculating...',
    'add': 'Add',
    'for_free_shipping': 'for free shipping',
    'all_transactions_encrypted': 'All transactions are secure and encrypted.',
    'required_field': 'This field is required',
    'valid_email': 'Please enter a valid email address',
    'valid_phone': 'Please enter a valid phone number (e.g., +971501234567)',
    'phone_length': 'Phone number must be between 7 and 20 digits',
    'select_emirate_required': 'Please select an emirate',
    'select_city_required': 'Please select a city',
    'address_required': 'Delivery address is required',
    'complete_address': 'Please provide a complete address',
    
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
    'orders_over': 'Orders over 200',
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
    'free_shipping_message': 'شحن مجاني للطلبات التي تزيد عن 200',
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
    
    // Checkout page translations
    'customer_info': 'معلومات العميل',
    'your_details': 'بياناتك',
    'shipping_info': 'معلومات الشحن',
    'delivery_information': 'معلومات التوصيل',
    'payment_info': 'معلومات الدفع',
    'secure_payment': 'دفع آمن',
    'include_country_code': 'أدخل رمز الدولة (مثل +971 للإمارات). يُستخدم لتحديثات الطلب والتوصيل.',
    'continue_to_shipping': 'المتابعة للشحن',
    'emirate': 'الإمارة',
    'city': 'المدينة',
    'delivery_address': 'عنوان التوصيل',
    'building_street_area': 'اسم/رقم المبنى، الشارع، المنطقة، معلم مميز',
    'complete_delivery_details': 'يرجى تقديم تفاصيل كاملة لضمان التوصيل السلس',
    'select_emirate': 'اختر إمارة',
    'select_city': 'اختر مدينة',
    'select_emirate_first': 'يرجى اختيار الإمارة أولاً',
    'continue_to_payment': 'المتابعة للدفع',
    'back': 'رجوع',
    'card_information': 'معلومات البطاقة',
    'all_transactions_secure': 'جميع المعاملات آمنة ومشفرة مع Stripe.',
    'pay_amount': 'ادفع',
    'tax': 'الضريبة',
    'discount': 'الخصم',
    'calculating': 'جاري الحساب...',
    'add': 'أضف',
    'for_free_shipping': 'للحصول على شحن مجاني',
    'all_transactions_encrypted': 'جميع المعاملات آمنة ومشفرة.',
    'required_field': 'هذا الحقل مطلوب',
    'valid_email': 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    'valid_phone': 'يرجى إدخال رقم هاتف صحيح (مثل +971501234567)',
    'phone_length': 'يجب أن يكون رقم الهاتف بين 7 و 20 رقماً',
    'select_emirate_required': 'يرجى اختيار إمارة',
    'select_city_required': 'يرجى اختيار مدينة',
    'address_required': 'عنوان التوصيل مطلوب',
    'complete_address': 'يرجى تقديم عنوان كامل',
    
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
    'orders_over': 'للطلبات أكثر من 200',
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

    // Contact page translations
    'get_in_touch': 'تواصل معنا',
    'contact_intro': 'يسعدنا التواصل معك! سواء كان لديك سؤال حول منتجاتنا، أو ترغب في طلب بكميات كبيرة، أو ترغب فقط في إلقاء التحية، فريقنا هنا للمساعدة.',
    'visit_us': 'قم بزيارتنا',
    'green_roasteries_coffee_house': 'مقهى جرين روستريز',
    'sheikh_zayed_road': 'شارع الشيخ زايد',
    'dubai_uae': 'دبي، الإمارات العربية المتحدة',
    'call_us': 'اتصل بنا',
    'email_us': 'راسلنا عبر البريد الإلكتروني',
    'dubai_location': 'موقعنا في دبي',
    'abu_dhabi_location': 'موقعنا في أبوظبي',
    'send_message': 'أرسل لنا رسالة',
    'full_name': 'الاسم الكامل',
    'email_address': 'البريد الإلكتروني',
    'phone_optional': 'رقم الهاتف (اختياري)',
    'subject': 'الموضوع',
    'message': 'الرسالة',
    'product_inquiry': 'استفسار عن منتج',
    'wholesale_inquiry': 'استفسار عن البيع بالجملة',
    'feedback': 'تعليق أو اقتراح',
    'other': 'أخرى',
    'store_hours': 'ساعات العمل',
    'monday_friday': 'الاثنين - الجمعة',
    'saturday': 'السبت',
    'sunday': 'الأحد',
    '8am_8pm': '8:00 صباحاً - 8:00 مساءً',
    '9am_6pm': '9:00 صباحاً - 6:00 مساءً',
    '9am_9pm': '9:00 صباحاً - 9:00 مساءً',
    '10am_7pm': '10:00 صباحاً - 7:00 مساءً',
    '8am_10pm': '8:00 صباحاً - 10:00 مساءً',
    '9am_8pm': '9:00 صباحاً - 8:00 مساءً',
    'online_support': 'الدعم عبر الإنترنت',
    'mon_fri': 'الاثنين-الجمعة',
    'sat_sun': 'السبت-الأحد',

    // About page translations
    'our_story': 'قصتنا',
    'our_story_tagline': 'من الحبة إلى الفنجان، شغفنا يغذي كل خطوة في الرحلة.',
    'our_journey': 'رحلتنا',
    'our_journey_desc': 'بدأت قصتنا من حبنا للقهوة! نستورد أفضل حبوب القهوة في العالم ونحمصها بعناية، نقدم لك تجربة ومنتجات عالية الجودة مصنوعة بحب.. لمحبي القهوة لدينا.',
    'chosen_with_care': 'مختارة بعناية، محمصة بحب',
    'chosen_with_care_desc_1': 'نسعى جاهدين لتحقيق سعادتك القصوى في تجربة محاصيلنا وجعلها تجربة لا تُنسى. يصنع خبراء التحميص لدينا كل دفعة بعناية لإبراز الطابع الفريد لكل نوع من أنواع الحبوب.',
    'chosen_with_care_desc_2': 'من هنا تبدأ الرحلة إلى ذروة مزاجك. كل فنجان يروي قصة التفاني والجودة والشغف التي تميز جرين روستريز.',
    'coffee_roasting': 'تحميص القهوة',
    'our_coffee_philosophy': 'فلسفتنا في القهوة',
    'our_coffee_philosophy_desc_1': 'في جرين روستريز، نؤمن بأن القهوة الاستثنائية تولد من احترام الحبة والمزارع وفن التحميص. نعمل بشكل وثيق مع المزارعين الذين يشاركوننا قيمنا في الاستدامة والجودة.',
    'our_coffee_philosophy_desc_2': 'كل منشأ نحصل منه على القهوة له قصته الفريدة ونكهته المميزة. نحن ملتزمون بإحياء هذه القصص من خلال عمليات التحميص المصممة بعناية.',
    'coffee_bean_selection': 'اختيار حبوب القهوة',
    'our_values': 'قيمنا',
    'quality': 'الجودة',
    'quality_desc': 'نحن لا نتنازل أبداً عن الجودة. من المصدر إلى التحميص إلى التخمير، التميز هو معيارنا.',
    'passion': 'الشغف',
    'passion_desc': 'حبنا للقهوة يدفع كل ما نقوم به. نحن نستكشف ونتعلم ونتقن حرفتنا باستمرار.',
    'sustainability': 'الاستدامة',
    'sustainability_desc': 'نحن ملتزمون بالمصادر الأخلاقية والممارسات الصديقة للبيئة في جميع أنحاء سلسلة التوريد لدينا.',
    'experience_our_coffee': 'جرب قهوتنا',
    'experience_our_coffee_desc': 'قم بزيارة مواقعنا في دبي وأبوظبي أو تسوق عبر الإنترنت لتجربة ما يميز جرين روستريز.',
    'shop_now': 'تسوق الآن',
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