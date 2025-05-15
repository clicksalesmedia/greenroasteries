'use client';

import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-900">
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <Image 
            src="/images/coffee-beans-bg.jpg" 
            alt="Coffee Beans" 
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Story</h1>
            <p className="text-xl text-white max-w-3xl mx-auto">
              From bean to cup, our passion fuels every step of the journey.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-8 relative inline-block">
              Our Journey
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black"></span>
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Our story began from our love of coffee! We import the best coffee beans in the world 
              & roast it carefully, We offer you an experience and quality products that are made with love..
              For our coffee lovers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-bold mb-4">Chosen with care, roasted with love</h3>
              <p className="text-gray-700 mb-4">
                We strive for your ultimate happiness in trying our crops and making it an unforgettable
                experience. Our master roasters carefully craft each batch to bring out the unique
                character of every bean variety.
              </p>
              <p className="text-gray-700">
                From here begins the journey to the peak of your mood. Every cup tells a story of
                dedication, quality, and passion that defines Green Roasteries.
              </p>
            </div>
            <div className="order-1 md:order-2 relative h-80 rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="/images/coffee-roasting.jpg" 
                alt="Coffee Roasting" 
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative h-80 rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="/images/coffee-beans-selection.jpg" 
                alt="Coffee Bean Selection" 
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Coffee Philosophy</h3>
              <p className="text-gray-700 mb-4">
                At Green Roasteries, we believe that exceptional coffee is born from respect for the 
                bean, the farmer, and the craft of roasting. We work closely with farmers who share
                our values of sustainability and quality.
              </p>
              <p className="text-gray-700">
                Each origin we source from has its own unique story and flavor profile. We're committed
                to bringing these stories to life through our carefully crafted roasting processes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 relative inline-block">
            Our Values
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black"></span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Quality</h3>
              <p className="text-gray-700">
                We never compromise on quality. From sourcing to roasting to brewing, excellence is our standard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Passion</h3>
              <p className="text-gray-700">
                Our love for coffee drives everything we do. We're constantly exploring, learning, and perfecting our craft.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Sustainability</h3>
              <p className="text-gray-700">
                We're committed to ethical sourcing and environmentally friendly practices throughout our supply chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-black text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Experience Our Coffee</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Visit our locations in Dubai and Abu Dhabi or shop online to experience the 
            Green Roasteries difference.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/shop" className="bg-white text-black px-8 py-3 rounded-md hover:bg-gray-200 transition">
              Shop Now
            </a>
            <a href="/contact" className="border border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-black transition">
              Visit Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 