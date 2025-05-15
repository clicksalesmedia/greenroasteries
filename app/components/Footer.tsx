'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Green Roasteries</h3>
            <p className="text-gray-300 mb-6">Experience premium coffee with our curated collection of beans from around the world.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <i className="fab fa-pinterest-p"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/shop" className="hover:text-white transition">Shop</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">Our Blog</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition">Reviews</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Shop</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link href="/shop" className="hover:text-white transition">All Coffee</Link></li>
              <li><Link href="/shop?category=Arabica" className="hover:text-white transition">Arabica</Link></li>
              <li><Link href="/shop?category=Robusta" className="hover:text-white transition">Robusta</Link></li>
              <li><Link href="/shop?category=Accessories" className="hover:text-white transition">Accessories</Link></li>
              <li><Link href="/shop?category=New" className="hover:text-white transition">New Arrivals</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Contact</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3"></i>
                <span>123 Coffee St, Brewing District, Dubai, UAE</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-3"></i>
                <span>+971 (50) 123-4567</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-3"></i>
                <span>info@greenroasteries.com</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-clock mr-3"></i>
                <span>Mon-Sat: 9:00 AM - 7:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 mb-4 md:mb-0">&copy; 2025 Green Roasteries. All rights reserved.</p>
            <div className="flex space-x-6 text-gray-300 text-sm">
              <Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/refund" className="hover:text-white transition">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 