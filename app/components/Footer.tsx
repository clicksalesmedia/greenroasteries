'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Green Roasteries</h3>
            <p className="text-gray-300 mb-6">We import the best coffee beans in the world & roast it carefully, We offer you an experience and
            quality products that are made with love For our coffee lovrs.</p>
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
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Shop</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link href="/shop" className="hover:text-white transition">All Coffee</Link></li>
              <li><Link href="/shop?category=ARABIC%20COFFEE" className="hover:text-white transition">Arabic Coffee</Link></li>
              <li><Link href="/shop?category=MEDIUM%20ROAST" className="hover:text-white transition">Medium Coffee</Link></li>
              <li><Link href="http://localhost:3000/shop?category=ESPRESSO%20ROAST" className="hover:text-white transition">Espresso Coffee</Link></li>
              <li><Link href="/shop?category=TURKISH%20ROAST" className="hover:text-white transition">Turkish Coffee</Link></li>
              <li><Link href="/shop?category=NUTS%20%26%20DRIED%20FRUITS" className="hover:text-white transition">Nuts & Dried Fruits</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Contact</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3"></i>
                <span>Al Dhaid, Laweedid - Sharjah</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-3"></i>
                <span>05 455 527 99</span>
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