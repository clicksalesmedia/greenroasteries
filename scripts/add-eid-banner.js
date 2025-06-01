#!/usr/bin/env node

// Script to add EID AL ADHA banner slider
const sliderData = {
  title: "EID AL ADHA - SPECIAL COLLECTION",
  titleAr: "عيد الأضحى - مجموعة خاصة",
  subtitle: "Celebrate with Premium Coffee & Nuts Collection",
  subtitleAr: "احتفل مع مجموعة القهوة والمكسرات المميزة",
  buttonText: "Shop EID Collection",
  buttonTextAr: "تسوق مجموعة العيد",
  buttonLink: "/shop?category=eid-al-adha",
  imageUrl: "/images/eidbanner.webp",
  backgroundColor: "#2d5016", // Dark green to match the banner
  textColor: "#ffffff",
  buttonColor: "#c9a961", // Gold color
  overlayColor: "rgba(0,0,0,0.3)",
  overlayOpacity: 30,
  order: 0, // Make it first
  isActive: true,
  textAnimation: "fade-up",
  imageAnimation: "fade-in",
  transitionSpeed: "medium",
  layout: "centered",
  accentColor: "#c9a961"
};

async function addEidBanner() {
  try {
    console.log('🎉 Adding EID AL ADHA banner slider...');
    
    const response = await fetch('http://localhost:3000/api/sliders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sliderData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ EID banner slider created successfully!');
    console.log('📋 Slider ID:', result.id);
    console.log('🖼️  Image path:', result.imageUrl);
    console.log('🌐 You can view it at: http://localhost:3000/');
    
    return result;
  } catch (error) {
    console.error('❌ Error creating EID banner:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addEidBanner()
    .then(() => {
      console.log('🚀 Ready to deploy!');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { addEidBanner, sliderData }; 