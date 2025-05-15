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
  
  // Get cart data from context
  const { items, totalItems, totalPrice, removeItem } = useCart();
  
  // Get translation function from language context
  const { t, language } = useLanguage();

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
            console.log('Processed categories:', processedCategories);
            setCategories(processedCategories);
          }
        } else {
          console.error('Failed to fetch categories from API, status:', response.status);
          // Fallback to default categories if API fails
          const fallbackCategories = language === 'ar' ? 
            [
              { id: 'arabica', name: 'أرابيكا' },
              { id: 'robusta', name: 'روبوستا' },
              { id: 'blend', name: 'خلطات' },
              { id: 'specialty', name: 'قهوة متخصصة' },
              { id: 'single-origin', name: 'أصل واحد' },
              { id: 'espresso', name: 'إسبريسو' },
              { id: 'decaf', name: 'خالية من الكافيين' }
            ] : 
            [
              { id: 'arabica', name: 'Arabica' },
              { id: 'robusta', name: 'Robusta' },
              { id: 'blend', name: 'Blend' },
              { id: 'specialty', name: 'Specialty' },
              { id: 'single-origin', name: 'Single Origin' },
              { id: 'espresso', name: 'Espresso' },
              { id: 'decaf', name: 'Decaf' }
            ];
          console.log('Using fallback categories:', fallbackCategories);
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories
        setCategories(
          language === 'ar' ? 
          [
            { id: 'arabica', name: 'أرابيكا' },
            { id: 'robusta', name: 'روبوستا' },
            { id: 'blend', name: 'خلطات' },
            { id: 'specialty', name: 'قهوة متخصصة' },
            { id: 'single-origin', name: 'أصل واحد' },
            { id: 'espresso', name: 'إسبريسو' },
            { id: 'decaf', name: 'خالية من الكافيين' }
          ] : 
          [
            { id: 'arabica', name: 'Arabica' },
            { id: 'robusta', name: 'Robusta' },
            { id: 'blend', name: 'Blend' },
            { id: 'specialty', name: 'Specialty' },
            { id: 'single-origin', name: 'Single Origin' },
            { id: 'espresso', name: 'Espresso' },
            { id: 'decaf', name: 'Decaf' }
          ]
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
      
      // Don't close mobile menu when clicking inside the menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const burgerButton = document.getElementById('mobile-menu-button');
        if (burgerButton && !burgerButton.contains(event.target as Node)) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent body scrolling when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto'; // Reset on unmount
    };
  }, [mobileMenuOpen, language]);

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
                            href={`/shop?category=${encodeURIComponent(category.name)}`}
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
                          href={`/shop?category=${encodeURIComponent(category.name)}`}
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
            <Link href="/search" className="text-gray-800">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </Link>
            
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
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50 py-2 border border-gray-100">
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