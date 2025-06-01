import { PrismaClient } from '../app/generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function ensureEidCategory() {
  try {
    console.log('🎉 Ensuring EID AL ADHA - CATALOG category exists...');

    // Check if EID AL ADHA category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: "EID AL ADHA - CATALOG" },
          { name: "EID AL ADHA CATALOG" },
          { nameAr: "عيد الأضحى - كتالوج" },
          { slug: "eid-al-adha-catalog" }
        ]
      }
    });

    if (existingCategory) {
      console.log('✅ EID AL ADHA category already exists, updating it...');
      
      const updatedCategory = await prisma.category.update({
        where: { id: existingCategory.id },
        data: {
          name: "EID AL ADHA - CATALOG",
          nameAr: "عيد الأضحى - كتالوج",
          slug: "eid-al-adha-catalog",
          description: "Special collection for Eid Al Adha celebration with premium coffee and nuts",
          descriptionAr: "مجموعة خاصة لعيد الأضحى المبارك مع القهوة المميزة والمكسرات",
          imageUrl: "/images/eidbanner.webp",
          isActive: true
        }
      });

      console.log('✅ EID AL ADHA category updated successfully!');
      console.log('📋 Category ID:', updatedCategory.id);
      console.log('🔗 Category slug:', updatedCategory.slug);
      return updatedCategory;
    } else {
      // Create new EID AL ADHA category
      const newCategory = await prisma.category.create({
        data: {
          id: uuidv4(),
          name: "EID AL ADHA - CATALOG",
          nameAr: "عيد الأضحى - كتالوج",
          slug: "eid-al-adha-catalog",
          description: "Special collection for Eid Al Adha celebration with premium coffee and nuts",
          descriptionAr: "مجموعة خاصة لعيد الأضحى المبارك مع القهوة المميزة والمكسرات",
          imageUrl: "/images/eidbanner.webp",
          isActive: true
        }
      });

      console.log('✅ EID AL ADHA category created successfully!');
      console.log('📋 Category ID:', newCategory.id);
      console.log('🔗 Category slug:', newCategory.slug);
      return newCategory;
    }
  } catch (error) {
    console.error('❌ Error managing EID AL ADHA category:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
ensureEidCategory()
  .then(() => {
    console.log('🚀 EID AL ADHA category ready for deployment!');
    console.log('🌐 You can view it at: /shop?category=eid-al-adha-catalog');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to ensure EID AL ADHA category:', error);
    process.exit(1);
  }); 