'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, UserIcon, ShoppingBagIcon, ChevronDownIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const shopDropdownRef = useRef<HTMLLIElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Define the search results type
  type SearchResultsType = {
    products: any[];
    categories: any[];
    variations: any;
    isLoading: boolean;
  };

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultsType>({
    products: [],
    categories: [],
    variations: { beans: [], types: [], sizes: [] },
    isLoading: false
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get cart data from context
  const { items, totalItems, totalPrice, removeItem } = useCart();
  
  // Get translation function from language context
  const { t, language } = useLanguage();

  // At the beginning of the component, add a mapping object for category name translations
  const getCategorySlug = (categoryName: string) => {
    // Map of Arabic category names to their English equivalents for URLs
    const categoryMappings: Record<string, string> = {
      'المكسرات والفواكه المجففة': 'NUTS & DRIED FRUITS',
      'مكسرات وفواكه مجففة': 'NUTS & DRIED FRUITS',
      'قهوة عربية': 'ARABIC COFFEE',
      'القهوة العربية': 'ARABIC COFFEE',
      'قهوة مختصة': 'SPECIALTY COFFEE',
      'قهوة مطحونة': 'GROUND COFFEE',
      'قهوة اسبريسو': 'ESPRESSO ROAST',
      'تحميص الإسبريسو': 'ESPRESSO ROAST',
      'قهوة متوسطة التحميص': 'MEDIUM ROAST',
      'تحميص متوسط': 'MEDIUM ROAST',
      'قهوة داكنة التحميص': 'DARK ROAST',
      'تحميص داكن': 'DARK ROAST',
      'قهوة فاتحة التحميص': 'LIGHT ROAST',
      'تحميص فاتح': 'LIGHT ROAST',
      'أكسسوارات القهوة': 'COFFEE ACCESSORIES',
      'تحميص تركي': 'TURKISH ROAST',
      'قهوة تركية': 'TURKISH COFFEE',
      'أرابيكا': 'ARABICA',
      'روبوستا': 'ROBUSTA',
      'خلطات': 'BLEND',
      'أصل واحد': 'SINGLE ORIGIN',
      'إسبريسو': 'ESPRESSO',
      'خالية من الكافيين': 'DECAF'
    };
    
    // Always use English category names in URLs, regardless of display language
    return categoryMappings[categoryName] || categoryName;
  };

  // Handle search functionality
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    // Close other dropdowns
    setShopDropdownOpen(false);
    setCartDropdownOpen(false);
    
    // Focus the search input when opening
    if (!searchOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setSearchResults((prev: SearchResultsType) => ({ ...prev, isLoading: true }));
      
      // Fetch products
      const productsRes = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
      const products = await productsRes.json();
      
      // Fetch categories
      const categoriesRes = await fetch(`/api/categories?search=${encodeURIComponent(searchQuery)}`);
      const categories = await categoriesRes.json();
      
      // Fetch variations (beans, additions, etc.)
      const variationsRes = await fetch(`/api/variations/search?query=${encodeURIComponent(searchQuery)}`);
      const variations = await variationsRes.json();
      
      setSearchResults({
        products: products.slice(0, 5), // Limit to 5 results for display
        categories: Array.isArray(categories) ? categories.slice(0, 3) : [],
        variations: variations || { beans: [], types: [], sizes: [] },
        isLoading: false
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({
        products: [],
        categories: [],
        variations: { beans: [], types: [], sizes: [] },
        isLoading: false
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    // Fetch categories for the dropdown
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        console.log(`Current language: ${language}`);
        console.log(`Translation for shop: ${t('shop', 'SHOP')}`);
        console.log(`Translation for all_products: ${t('all_products', 'All Products')}`);
        console.log(`Fetching categories for language: ${language}`);
        const response = await fetch(`/api/categories?lang=${language}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Categories API response:', data);
          // Process the categories data
          if (Array.isArray(data)) {
            const processedCategories = data.map(cat => {
              if (typeof cat === 'object' && cat !== null) {
                return {
                  id: cat.id || `cat-${Math.random().toString(36).substr(2, 9)}`,
                  name: cat.name || 'Unnamed Category'
                };
              } else if (typeof cat === 'string') {
                return {
                  id: `cat-${Math.random().toString(36).substr(2, 9)}`,
                  name: cat
                };
              } else {
                return { id: 'unknown', name: 'Other' };
              }
            });
            
            // Sort the categories in the specific order requested
            const orderedCategories = sortCategoriesInCustomOrder(processedCategories);
            
            console.log('Processed categories:', orderedCategories);
            setCategories(orderedCategories);
          }
        } else {
          console.error('Failed to fetch categories from API, status:', response.status);
          // Fallback to default categories in the specified order
          const fallbackCategories = sortCategoriesInCustomOrder(language === 'ar' ? 
            [
              { id: 'arabic-coffee', name: 'قهوة عربية' },
              { id: 'filter-coffee', name: 'قهوة مطحونة' },
              { id: 'espresso-roast', name: 'قهوة اسبريسو' },
              { id: 'turkish-coffee', name: 'قهوة تركية' },
              { id: 'nuts-dried-food', name: 'المكسرات والفواكه المجففة' },
              { id: 'arabica', name: 'أرابيكا' },
              { id: 'robusta', name: 'روبوستا' },
              { id: 'blend', name: 'خلطات' },
              { id: 'specialty', name: 'قهوة متخصصة' },
              { id: 'single-origin', name: 'أصل واحد' },
              { id: 'decaf', name: 'خالية من الكافيين' }
            ] : 
            [
              { id: 'arabic-coffee', name: 'ARABIC COFFEE' },
              { id: 'filter-coffee', name: 'FILTER COFFEE' },
              { id: 'espresso-roast', name: 'ESPRESSO ROAST' },
              { id: 'turkish-coffee', name: 'TURKISH COFFEE' },
              { id: 'nuts-dried-food', name: 'NUTS & DRIED FOOD' },
              { id: 'arabica', name: 'Arabica' },
              { id: 'robusta', name: 'Robusta' },
              { id: 'blend', name: 'Blend' },
              { id: 'specialty', name: 'Specialty' },
              { id: 'single-origin', name: 'Single Origin' },
              { id: 'decaf', name: 'Decaf' }
            ]
          );
          console.log('Using fallback categories:', fallbackCategories);
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories in the specified order
        setCategories(
          sortCategoriesInCustomOrder(language === 'ar' ? 
          [
            { id: 'arabic-coffee', name: 'قهوة عربية' },
            { id: 'filter-coffee', name: 'قهوة مطحونة' },
            { id: 'espresso-roast', name: 'قهوة اسبريسو' },
            { id: 'turkish-coffee', name: 'قهوة تركية' },
            { id: 'nuts-dried-food', name: 'المكسرات والفواكه المجففة' }
          ] : 
          [
            { id: 'arabic-coffee', name: 'ARABIC COFFEE' },
            { id: 'filter-coffee', name: 'FILTER COFFEE' },
            { id: 'espresso-roast', name: 'ESPRESSO ROAST' },
            { id: 'turkish-coffee', name: 'TURKISH COFFEE' },
            { id: 'nuts-dried-food', name: 'NUTS & DRIED FOOD' }
          ])
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();

    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(event.target as Node)) {
        setShopDropdownOpen(false);
      }
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setCartDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      
      // Don't close mobile menu when clicking inside the menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const burgerButton = document.getElementById('mobile-menu-button');
        if (burgerButton && !burgerButton.contains(event.target as Node)) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown as unknown as EventListener);
    
    // Prevent body scrolling when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
      document.body.style.overflow = 'auto'; // Reset on unmount
    };
  }, [mobileMenuOpen, searchOpen, language]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Close other dropdowns
    setShopDropdownOpen(false);
    setCartDropdownOpen(false);
  };

  const toggleShopDropdown = () => {
    setShopDropdownOpen(!shopDropdownOpen);
    if (!shopDropdownOpen) {
      setCartDropdownOpen(false);
    }
  };
  
  const toggleCartDropdown = () => {
    setCartDropdownOpen(!cartDropdownOpen);
    if (!cartDropdownOpen) {
      setShopDropdownOpen(false);
    }
  };

  // Format price to 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Add the new function to sort categories in the specific order
  const sortCategoriesInCustomOrder = (categories: {id: string, name: string}[]) => {
    // Define the exact priority order
    const priorityOrder = [
      // English names
      'ARABIC COFFEE',
      'FILTER COFFEE',
      'ESPRESSO ROAST',
      'TURKISH COFFEE',
      'TURKISH ROAST',
      'NUTS & DRIED FOOD',
      'NUTS & DRIED FRUITS',
      
      // Arabic names
      'قهوة عربية',
      'القهوة العربية',
      'قهوة مطحونة',
      'قهوة اسبريسو',
      'تحميص الإسبريسو',
      'قهوة تركية',
      'تحميص تركي',
      'المكسرات والفواكه المجففة',
      'مكسرات وفواكه مجففة'
    ];
    
    // Create a hardcoded set of categories in the exact order we want
    const hardcodedCategories = language === 'ar' ? [
      { id: 'arabic-coffee', name: 'قهوة عربية' },
      { id: 'filter-coffee', name: 'قهوة مطحونة' },
      { id: 'espresso-roast', name: 'قهوة اسبريسو' },
      { id: 'turkish-coffee', name: 'قهوة تركية' },
      { id: 'nuts-dried-food', name: 'المكسرات والفواكه المجففة' }
    ] : [
      { id: 'arabic-coffee', name: 'ARABIC COFFEE' },
      { id: 'filter-coffee', name: 'FILTER COFFEE' },
      { id: 'espresso-roast', name: 'ESPRESSO ROAST' },
      { id: 'turkish-coffee', name: 'TURKISH COFFEE' },
      { id: 'nuts-dried-food', name: 'NUTS & DRIED FOOD' }
    ];
    
    // First, filter the input categories to find our priority categories
    const matchedCategories = categories.filter(cat => {
      // Convert names to uppercase for case-insensitive comparison
      const normalizedName = cat.name.toUpperCase();
      return priorityOrder.some(po => po.toUpperCase() === normalizedName);
    });
    
    // If we have matched categories from the API, use those
    if (matchedCategories.length > 0) {
      // Sort based on priority order
      const sortedMatched = [...matchedCategories].sort((a, b) => {
        const indexA = priorityOrder.findIndex(po => 
          po.toUpperCase() === a.name.toUpperCase());
        const indexB = priorityOrder.findIndex(po => 
          po.toUpperCase() === b.name.toUpperCase());
          
        // If both are found in priority order, use that order
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If only one is found, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Otherwise, keep original order
        return 0;
      });
      
      // Find all other categories that didn't match our priority list
      const otherCategories = categories.filter(cat => 
        !priorityOrder.some(po => po.toUpperCase() === cat.name.toUpperCase())
      );
      
      // Combine the sorted matches with other categories
      return [...sortedMatched, ...otherCategories];
    }
    
    // If we don't have matches or the list is empty, return our hardcoded list
    return hardcodedCategories;
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-2">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div>
            {t('free_shipping_message', 'Free shipping on all orders over 65D')}
          </div>
          <div className="flex">
            <a href="#" className="mr-4">{t('my_account', 'My Account')}</a>
            <a href="#" className="mr-4">{t('wishlist', 'Wishlist')}</a>
            <a href="#" className="mr-4">{t('contact', 'Contact')}</a>
            <Link href="/cart">{t('cart', 'Cart')} ({totalItems})</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white py-4 shadow-sm relative">
        <div className="container mx-auto flex justify-between items-center px-4 relative">
          {/* Navigation on left - Mobile Menu */}
          <div 
            ref={mobileMenuRef}
            className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-opacity duration-300 ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div 
              className={`absolute top-0 left-0 h-full w-3/4 max-w-xs bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4">
                <div className="text-lg font-semibold text-black">Menu</div>
                <button 
                  onClick={toggleMobileMenu}
                  className="text-gray-500 hover:text-black focus:outline-none"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-4">
                  <li className="border-b border-gray-100 pb-3">
                    <Link 
                      href="/" 
                      className="text-black font-medium block py-2 hover:text-gray-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      HOME
                    </Link>
                  </li>
                  <li className="border-b border-gray-100 pb-3">
                    <Link 
                      href="/about" 
                      className="text-black font-medium block py-2 hover:text-gray-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ABOUT
                    </Link>
                  </li>
                  <li className="border-b border-gray-100 pb-3">
                    <div className="py-2">
                      <button 
                        onClick={toggleShopDropdown}
                        className="flex items-center justify-between w-full text-black font-medium focus:outline-none"
                      >
                        <span>{t('shop', 'SHOP')}</span>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Shop submenu */}
                      <div className={`mt-2 space-y-2 pl-4 overflow-hidden transition-max-height duration-300 ease-in-out ${
                        shopDropdownOpen ? 'max-h-96' : 'max-h-0'
                      }`}>
                        <Link 
                          href="/shop" 
                          className="block py-2 text-gray-800 hover:text-black"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t('all_products', 'All Products')}
                        </Link>
                        
                        {categories.map(category => (
                          <Link 
                            key={category.id}
                            href={`/shop?category=${encodeURIComponent(getCategorySlug(category.name))}`}
                            className="block py-2 text-gray-800 hover:text-black"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </li>
                  <li className="border-b border-gray-100 pb-3">
                    <Link 
                      href="/contact" 
                      className="text-black font-medium block py-2 hover:text-gray-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      CONTACT
                    </Link>
                  </li>
                </ul>
                
                {/* Mobile menu footer with additional links */}
                <div className="mt-8 pt-4 border-t border-gray-100">
                  <div className="space-y-3">
                    <Link 
                      href="/terms" 
                      className="block text-sm text-gray-600 hover:text-black"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Terms & Conditions
                    </Link>
                    <Link 
                      href="/privacy" 
                      className="block text-sm text-gray-600 hover:text-black"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Privacy Policy
                    </Link>
                    <Link 
                      href="/refund" 
                      className="block text-sm text-gray-600 hover:text-black"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Refund Policy
                    </Link>
                  </div>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Navigation on left - Desktop Menu */}
          <nav className="hidden md:block md:w-auto order-1 md:flex-1">
            <ul className="flex flex-row space-x-8">
              <li><Link href="/" className="text-black no-underline navbar-item font-medium block py-2 md:py-0">{t('home', 'HOME')}</Link></li>
              <li><Link href="/about" className="text-black no-underline navbar-item font-medium block py-2 md:py-0">{t('about', 'ABOUT')}</Link></li>
              <li className="relative" ref={shopDropdownRef}>
                <button 
                  onClick={toggleShopDropdown}
                  className="flex items-center text-black no-underline navbar-item font-medium py-2 md:py-0 focus:outline-none"
                >
                  {t('shop', 'SHOP')}
                  <ChevronDownIcon className={`ml-1 h-4 w-4 transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Categories dropdown */}
                {shopDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50 py-2 border border-gray-100">
                    <Link 
                      href="/shop" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                      onClick={() => setShopDropdownOpen(false)}
                    >
                      {t('all_products', 'All Products')}
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    {isLoading ? (
                      <div className="px-4 py-2 text-sm text-gray-500">Loading categories...</div>
                    ) : categories.length > 0 ? (
                      categories.map(category => (
                        <Link 
                          key={category.id}
                          href={`/shop?category=${encodeURIComponent(getCategorySlug(category.name))}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShopDropdownOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">No categories found</div>
                    )}
                  </div>
                )}
              </li>
              <li><Link href="/contact" className="text-black no-underline navbar-item font-medium block py-2 md:py-0">{t('contact', 'CONTACT')}</Link></li>
            </ul>
          </nav>
          
          {/* Logo in the center */}
          <div className={`text-3xl font-bold ${language === 'ar' ? 'md:text-center md:flex-1 order-2 md:order-2 text-right' : 'md:text-center md:flex-1 order-2 md:order-2 text-left'}`}>
            <Link href="/" className="inline-block">
              <Image 
                src="/images/green-roasteries-logo.png" 
                alt="Green Roasteries" 
                width={200} 
                height={200}
                className="h-16 w-auto"
                priority
              />
            </Link>
          </div>
          
          {/* Icons on the right */}
          <div className="flex items-center space-x-6 order-3 md:flex-1 md:justify-end">
            <div className="relative" ref={searchRef}>
              <button 
                onClick={toggleSearch}
                className="text-gray-800 focus:outline-none"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              
              {/* Search modal/dropdown */}
              {searchOpen && (
                <div className={`absolute ${language === 'ar' ? 'right-auto left-0' : 'right-0'} mt-2 w-80 md:w-96 bg-white shadow-lg rounded-md z-50 p-4 border border-gray-100`}>
                  <form onSubmit={handleSearchSubmit}>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                      <input
                        type="text"
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder={t('search_placeholder', 'Search products, categories...')}
                        className="w-full px-4 py-2 focus:outline-none"
                      />
                      <button 
                        type="submit"
                        className="bg-black text-white px-3 py-2"
                      >
                        <MagnifyingGlassIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                  
                  {/* Search results */}
                  {searchQuery && (
                    <div className="mt-4 max-h-80 overflow-y-auto">
                      {searchResults.isLoading ? (
                        <div className="py-3 text-center text-gray-500">
                          {t('loading', 'Loading...')}
                        </div>
                      ) : (
                        <>
                          {/* Products section */}
                          {searchResults.products && searchResults.products.length > 0 && (
                            <div className="mb-4">
                              <h3 className="font-medium text-sm text-gray-500 mb-2">{t('products', 'Products')}</h3>
                              <div className="space-y-3">
                                {searchResults.products.map((product: any) => (
                                  <Link 
                                    key={product.id} 
                                    href={`/product/${product.slug}`}
                                    className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                                    onClick={() => setSearchOpen(false)}
                                  >
                                    <div className="w-10 h-10 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0">
                                      {product.imageUrl ? (
                                        <Image 
                                          src={product.imageUrl} 
                                          alt={product.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <ShoppingBagIcon className="h-5 w-5" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium">
                                        {language === 'ar' && product.nameAr ? product.nameAr : product.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {product.price.toFixed(2)}D
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                                <Link 
                                  href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                                  className="block text-sm text-center text-black underline py-1 hover:text-gray-600"
                                  onClick={() => setSearchOpen(false)}
                                >
                                  {t('view_all_results', 'View all results')}
                                </Link>
                              </div>
                            </div>
                          )}
                          
                          {/* Categories section */}
                          {searchResults.categories && searchResults.categories.length > 0 && (
                            <div className="mb-4">
                              <h3 className="font-medium text-sm text-gray-500 mb-2">{t('categories', 'Categories')}</h3>
                              <div className="space-y-2">
                                {searchResults.categories.map((category: any) => (
                                  <Link 
                                    key={category.id} 
                                    href={`/shop?category=${encodeURIComponent(getCategorySlug(category.name))}`}
                                    className="block p-2 hover:bg-gray-50 rounded-md"
                                    onClick={() => setSearchOpen(false)}
                                  >
                                    <span className="text-sm font-medium">
                                      {language === 'ar' && category.nameAr ? category.nameAr : category.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Variations section (beans, additions, etc.) */}
                          {searchResults.variations && (
                            <>
                              {/* Beans */}
                              {searchResults.variations.beans && searchResults.variations.beans.length > 0 && (
                                <div className="mb-4">
                                  <h3 className="font-medium text-sm text-gray-500 mb-2">{t('coffee_beans', 'Coffee Beans')}</h3>
                                  <div className="space-y-2">
                                    {searchResults.variations.beans.map((bean: any) => (
                                      <Link 
                                        key={bean.id} 
                                        href={`/shop?beans=${encodeURIComponent(bean.name)}`}
                                        className="block p-2 hover:bg-gray-50 rounded-md"
                                        onClick={() => setSearchOpen(false)}
                                      >
                                        <span className="text-sm font-medium">
                                          {language === 'ar' && bean.arabicName ? bean.arabicName : bean.name}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Additions (Types) */}
                              {searchResults.variations.types && searchResults.variations.types.length > 0 && (
                                <div className="mb-4">
                                  <h3 className="font-medium text-sm text-gray-500 mb-2">{t('additions', 'Additions')}</h3>
                                  <div className="space-y-2">
                                    {searchResults.variations.types.map((type: any) => (
                                      <Link 
                                        key={type.id} 
                                        href={`/shop?additions=${encodeURIComponent(type.name)}`}
                                        className="block p-2 hover:bg-gray-50 rounded-md"
                                        onClick={() => setSearchOpen(false)}
                                      >
                                        <span className="text-sm font-medium">
                                          {language === 'ar' && type.arabicName ? type.arabicName : type.name}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* No results message */}
                          {(!searchResults.products || searchResults.products.length === 0) && 
                           (!searchResults.categories || searchResults.categories.length === 0) && 
                           (!searchResults.variations.beans || searchResults.variations.beans.length === 0) && 
                           (!searchResults.variations.types || searchResults.variations.types.length === 0) && (
                            <div className="py-3 text-center text-gray-500">
                              {t('no_results', 'No results found')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Add language switcher next to search icon */}
            <LanguageSwitcher />
            
            <Link href="/account" className="text-gray-800">
              <UserIcon className="h-5 w-5" />
            </Link>
            
            {/* Cart icon with count badge and dropdown */}
            <div className="relative" ref={cartDropdownRef}>
              <button 
                onClick={toggleCartDropdown}
                className="flex items-center text-gray-800 focus:outline-none"
                aria-label="Shopping cart"
              >
                <div className="relative">
                  <ShoppingBagIcon className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
              </button>
              
              {/* Cart dropdown */}
              {cartDropdownOpen && (
                <div className={`absolute ${language === 'ar' ? 'right-auto left-0' : 'right-0'} mt-2 w-80 bg-white shadow-lg rounded-md z-50 py-2 border border-gray-100`}>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-medium text-lg">{t('your_cart', 'Your Cart')} ({totalItems})</h3>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      {t('cart_empty', 'Your cart is empty')}
                    </div>
                  ) : (
                    <>
                      <div className="max-h-80 overflow-y-auto">
                        {items.map(item => (
                          <div key={item.id} className="px-4 py-3 border-b border-gray-100 flex">
                            {/* Product image */}
                            <div className="w-16 h-16 relative flex-shrink-0 bg-gray-100 rounded">
                              {item.image ? (
                                <Image 
                                  src={item.image} 
                                  alt={item.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <ShoppingBagIcon className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            
                            {/* Product details */}
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between">
                                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="text-gray-400 hover:text-red-500"
                                  aria-label="Remove item"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {Object.values(item.variation).filter(Boolean).join(', ')}
                              </div>
                              <div className="mt-1 flex justify-between">
                                <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                                <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}D</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Cart total and checkout button */}
                      <div className="px-4 py-3">
                        <div className="flex justify-between mb-3">
                          <span className="font-medium">{t('total', 'Total')}:</span>
                          <span className="font-bold">{formatPrice(totalPrice)}D</span>
                        </div>
                        <Link
                          href="/cart"
                          className="block w-full bg-black text-white text-center py-2 rounded-md hover:bg-gray-800 transition"
                          onClick={() => setCartDropdownOpen(false)}
                        >
                          {t('view_cart', 'View Cart')}
                        </Link>
                        <Link
                          href="/checkout"
                          className="block w-full bg-black text-white text-center py-2 rounded-md mt-2 hover:bg-gray-800 transition"
                          onClick={() => setCartDropdownOpen(false)}
                        >
                          {t('checkout', 'Checkout')} - {formatPrice(totalPrice)}D
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button 
              id="mobile-menu-button"
              className="md:hidden text-gray-800 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <style jsx>{`
        .navbar-item {
          position: relative;
        }
        .navbar-item:after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -2px;
          left: 0;
          background-color: #333;
          transition: width 0.3s ease;
        }
        .navbar-item:hover:after {
          width: 100%;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 15px;
        }
      `}</style>
    </>
  );
} 