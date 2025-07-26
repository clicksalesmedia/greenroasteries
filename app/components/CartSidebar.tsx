'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import UAEDirhamSymbol from './UAEDirhamSymbol';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BundleProduct {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  imageUrl: string;
  slug: string;
  discount?: number;
  discountType?: string;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateItemQuantity, totalPrice, totalItems } = useCart();
  const { language, t, contentByLang } = useLanguage();
  const [bundleProducts, setBundleProducts] = useState<BundleProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch bundle/recommended products
  const fetchBundleProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=4&featured=true&random=true');
      if (response.ok) {
        const data = await response.json();
        const processedProducts = data.map((product: any) => ({
          id: product.id,
          name: product.name || '',
          nameAr: product.nameAr || '',
          price: product.price || 0,
          imageUrl: product.imageUrl || (product.images?.[0]?.url || product.images?.[0] || '/images/coffee-placeholder.jpg'),
          slug: product.slug || 'product',
          discount: product.discount || 0,
          discountType: product.discountType || 'PERCENTAGE'
        }));
        setBundleProducts(processedProducts);
      }
    } catch (error) {
      console.error('Error fetching bundle products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && bundleProducts.length === 0) {
      fetchBundleProducts();
    }
  }, [isOpen, bundleProducts.length, fetchBundleProducts]);

  // Format price helper
  const formatPrice = useCallback((price: number) => (
    <span className="flex items-center gap-1">
      {price.toFixed(2)}
      <UAEDirhamSymbol size={14} />
    </span>
  ), []);

  // Get discounted price
  const getDiscountedPrice = useCallback((price: number, discount?: number, discountType?: string) => {
    if (!discount) return price;
    if (discountType === 'PERCENTAGE') {
      return price * (1 - discount / 100);
    } else if (discountType === 'FIXED_AMOUNT') {
      return Math.max(0, price - discount);
    }
    return price;
  }, []);

  // Get product name based on language
  const getProductName = useCallback((product: any) => {
    return contentByLang(product.name || '', product.nameAr || product.name || '');
  }, [contentByLang]);

  // Get variation display text
  const getVariationText = useCallback((variation: any) => {
    if (!variation) return '';
    const parts = [];
    if (variation.weight) parts.push(variation.weight);
    if (variation.beans) parts.push(variation.beans);
    if (variation.additions) parts.push(variation.additions);
    return parts.join(', ');
  }, []);

  // Desktop variant (right to left)
  const desktopVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } }
  };

  // Mobile variant (bottom to top)
  const mobileVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <>
      <style jsx global>{`
        .cart-sidebar-overlay {
          backdrop-filter: blur(4px);
        }
        
        .cart-sidebar {
          box-shadow: -10px 0 50px rgba(0, 0, 0, 0.15);
        }
        
        .cart-sidebar-mobile {
          box-shadow: 0 -10px 50px rgba(0, 0, 0, 0.15);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
        }
        
        .bundle-card {
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .bundle-card:hover {
          transform: translateY(-2px);
          border-color: #c9a961;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .cart-item {
          transition: all 0.3s ease;
        }
        
        .cart-item:hover {
          background-color: #f9fafb;
        }
        
        .quantity-btn {
          transition: all 0.2s ease;
        }
        
        .quantity-btn:hover {
          background-color: #f3f4f6;
          transform: scale(1.1);
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="cart-sidebar-overlay fixed inset-0 bg-black/30 z-50"
            />

            {/* Desktop Sidebar */}
            <motion.div
              variants={desktopVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="cart-sidebar hidden lg:block fixed top-0 right-0 h-full w-[480px] bg-white z-50 overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <ShoppingCartIcon className="w-6 h-6" />
                    <h2 className="text-xl font-bold">
                      {t('shopping_cart', 'Shopping Cart')} ({totalItems})
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">{t('cart_empty', 'Your cart is empty')}</p>
                      <button
                        onClick={onClose}
                        className="h-8 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center justify-center"
                      >
                        {t('continue_shopping', 'Continue Shopping')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="cart-item flex gap-4 p-4 rounded-lg">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={item.image || '/images/coffee-placeholder.jpg'}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1">{getProductName(item)}</h3>
                            {getVariationText(item.variation) && (
                              <p className="text-xs text-gray-500 mb-2">{getVariationText(item.variation)}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                >
                                  <MinusIcon className="w-2.5 h-2.5 text-gray-600" />
                                </button>
                                <span className="w-5 text-center text-xs">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  className="w-5 h-5 rounded bg-green-200 hover:bg-green-300 flex items-center justify-center"
                                >
                                  <PlusIcon className="w-2.5 h-2.5 text-green-600" />
                                </button>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-bold text-sm mb-1">{formatPrice(item.price * item.quantity)}</div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-1 py-0.5 rounded"
                                >
                                  {t('remove', 'Remove')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bundle Products */}
                  {items.length > 0 && bundleProducts.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="font-bold mb-4">{t('you_might_also_like', 'You might also like')}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {bundleProducts.slice(0, 4).map((product) => (
                          <div key={product.id} className="bundle-card bg-white rounded-lg p-3 border">
                            <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="120px"
                              />
                            </div>
                            <h4 className="font-medium text-xs mb-1 line-clamp-2">{getProductName(product)}</h4>
                            <div className="text-sm font-bold mb-2">
                              {product.discount ? (
                                <div className="flex items-center gap-1">
                                  <span>{formatPrice(getDiscountedPrice(product.price, product.discount, product.discountType))}</span>
                                  <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                                </div>
                              ) : (
                                formatPrice(product.price)
                              )}
                            </div>
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={onClose}
                              className="block text-center bg-blue-500 hover:bg-blue-600 text-white py-0.5 px-1.5 rounded text-xs"
                            >
                              {t('add', 'Add')}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div className="border-t border-gray-200 p-6 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t('total', 'Total')}</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={onClose}
                        className="h-8 px-3 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200 flex items-center justify-center"
                      >
                        {t('continue_shopping', 'Continue Shopping')}
                      </button>
                      <Link
                        href="/checkout"
                        onClick={onClose}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center justify-center"
                      >
                        {t('order_now', 'Order Now')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile Bottom Sheet */}
            <motion.div
              variants={mobileVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="cart-sidebar-mobile block lg:hidden fixed bottom-0 left-0 right-0 bg-white z-50 min-h-[30vh] max-h-[40vh] overflow-hidden rounded-t-xl shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Handle */}
                <div className="flex justify-center py-2">
                  <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCartIcon className="w-5 h-5" />
                    <h2 className="font-bold text-sm">
                      {t('cart', 'Cart')} ({totalItems})
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 px-4 pb-4 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">{t('cart_empty', 'Your cart is empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Show only the last added item on mobile */}
                      {items.slice(-1).map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={item.image || '/images/coffee-placeholder.jpg'}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1">{getProductName(item)}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                              <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {items.length > 1 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{items.length - 1} {t('more_items', 'more items')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Footer */}
                <div className="border-t border-gray-200 p-4 mt-auto bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">{t('total', 'Total')}: {formatPrice(totalPrice)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={onClose}
                      className="h-8 px-3 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200 flex items-center justify-center"
                    >
                      {t('continue', 'Continue')}
                    </button>
                    <Link
                      href="/checkout"
                      onClick={onClose}
                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center justify-center"
                    >
                      {t('order_now', 'Order Now')}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 