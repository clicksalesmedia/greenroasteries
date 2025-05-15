import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

// Arabic translations for common coffee categories
const arabicCategories = [
  { english: 'ARABIC COFFEE', arabic: 'القهوة العربية' },
  { english: 'ESPRESSO ROAST', arabic: 'تحميص الإسبريسو' },
  { english: 'MEDIUM ROAST', arabic: 'تحميص متوسط' },
  { english: 'NUTS & DRIED FRUITS', arabic: 'المكسرات والفواكه المجففة' },
  { english: 'TURKISH ROAST', arabic: 'تحميص تركي' },
  { english: 'All Products', arabic: 'جميع المنتجات' },
  { english: 'Arabica', arabic: 'أرابيكا' },
  { english: 'Robusta', arabic: 'روبوستا' },
  { english: 'Blend', arabic: 'خلطة' },
  { english: 'Specialty', arabic: 'قهوة متخصصة' },
  { english: 'Single Origin', arabic: 'أصل واحد' },
  { english: 'Espresso', arabic: 'إسبريسو' },
  { english: 'Decaf', arabic: 'خالية من الكافيين' },
  { english: 'Light Roast', arabic: 'تحميص خفيف' },
  { english: 'Dark Roast', arabic: 'تحميص داكن' },
  { english: 'Turkish Coffee', arabic: 'قهوة تركية' },
];

export async function GET() {
  try {
    // Get all existing categories
    const categories = await prisma.category.findMany();
    const updates = [];

    // Update each category with Arabic name if it doesn't have one
    for (const category of categories) {
      // Skip if it already has an Arabic name
      if (category.nameAr) {
        continue;
      }

      // Find matching Arabic translation
      const match = arabicCategories.find(ac => 
        ac.english.toLowerCase() === category.name.toLowerCase()
      );

      if (match) {
        // Update the category with Arabic name
        const updated = await prisma.category.update({
          where: { id: category.id },
          data: { nameAr: match.arabic }
        });
        updates.push({ id: updated.id, name: updated.name, nameAr: updated.nameAr });
      }
    }

    // If no matching categories found, create some default ones with both languages
    if (categories.length === 0) {
      for (const cat of arabicCategories) {
        const slug = cat.english.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
        const newCategory = await prisma.category.create({
          data: {
            name: cat.english,
            nameAr: cat.arabic,
            slug: slug,
            isActive: true
          }
        });
        updates.push(newCategory);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updates.length} categories with Arabic names`,
      updates 
    });
  } catch (error) {
    console.error('Failed to update category Arabic names:', error);
    return NextResponse.json(
      { error: 'Failed to update category Arabic names', details: error },
      { status: 500 }
    );
  }
} 