import { PrismaClient } from '../app/generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function addEidBanner() {
  try {
    console.log('🎉 Adding EID AL ADHA banner slider...');

    // Check if EID banner already exists
    const existingEidBanner = await prisma.slider.findFirst({
      where: {
        title: {
          contains: "EID AL ADHA"
        }
      }
    });

    if (existingEidBanner) {
      console.log('✅ EID banner already exists, updating it...');
      
      const updatedSlider = await prisma.slider.update({
        where: { id: existingEidBanner.id },
        data: {
          title: "EID AL ADHA - SPECIAL COLLECTION",
          titleAr: "عيد الأضحى - مجموعة خاصة",
          subtitle: "Celebrate with Premium Coffee & Nuts Collection",
          subtitleAr: "احتفل مع مجموعة القهوة والمكسرات المميزة",
          buttonText: "Shop EID Collection",
          buttonTextAr: "تسوق مجموعة العيد",
          buttonLink: "/shop?category=eid-al-adha",
          imageUrl: "/images/eidbanner.webp",
          backgroundColor: "#2d5016",
          textColor: "#ffffff",
          buttonColor: "#c9a961",
          overlayColor: "rgba(0,0,0,0.3)",
          overlayOpacity: 30,
          order: 0,
          isActive: true,
          textAnimation: "fade-up",
          imageAnimation: "fade-in",
          transitionSpeed: "medium",
          layout: "centered",
          accentColor: "#c9a961"
        }
      });

      console.log('✅ EID banner updated successfully!');
      console.log('📋 Slider ID:', updatedSlider.id);
      return updatedSlider;
    } else {
      // Create new EID banner
      const newSlider = await prisma.slider.create({
        data: {
          id: uuidv4(),
          title: "EID AL ADHA - SPECIAL COLLECTION",
          titleAr: "عيد الأضحى - مجموعة خاصة",
          subtitle: "Celebrate with Premium Coffee & Nuts Collection",
          subtitleAr: "احتفل مع مجموعة القهوة والمكسرات المميزة",
          buttonText: "Shop EID Collection",
          buttonTextAr: "تسوق مجموعة العيد",
          buttonLink: "/shop?category=eid-al-adha",
          imageUrl: "/images/eidbanner.webp",
          backgroundColor: "#2d5016",
          textColor: "#ffffff",
          buttonColor: "#c9a961",
          overlayColor: "rgba(0,0,0,0.3)",
          overlayOpacity: 30,
          order: 0,
          isActive: true,
          textAnimation: "fade-up",
          imageAnimation: "fade-in",
          transitionSpeed: "medium",
          layout: "centered",
          accentColor: "#c9a961"
        }
      });

      console.log('✅ EID banner created successfully!');
      console.log('📋 Slider ID:', newSlider.id);
      return newSlider;
    }
  } catch (error) {
    console.error('❌ Error managing EID banner:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
addEidBanner()
  .then(() => {
    console.log('🚀 EID banner ready for deployment!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to add EID banner:', error);
    process.exit(1);
  }); 